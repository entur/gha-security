import * as fs from "node:fs";
import * as core from "@actions/core";
import { Ajv } from "ajv";
import type { Octokit } from "octokit";
import * as yaml from "yaml";
import type { Allowlist } from "./allowlist.js";
import type { Notifications } from "./notifications.js";

interface ScannerSpec {
	inherit?: string;
	centralAllowlist?: boolean;
	allowlist?: Allowlist[];
	notifications?: Notifications;
}

interface ScannerMetadata {
	id: string;
	name?: string;
	owner?: string;
}

interface ScannerConfig {
	apiVersion: string;
	kind: string;
	metadata?: ScannerMetadata;
	spec?: ScannerSpec;
}

const parseYamlConfig = (config: string) => {
	try {
		return yaml.parse(config) as ScannerConfig;
	} catch (error) {
		if (error instanceof Error) {
			core.warning(`Failed to parse yaml config: ${error.message}`);
			return null;
		}

		core.warning("Failed to parse yaml config");
		return null;
	}
};

const hasAccessToRepository = async (octokit: Octokit, repository: string) => {
	try {
		await octokit.rest.repos.get({
			owner: "Entur",
			repo: repository,
		});
		return true;
	} catch (error) {
		if (error instanceof Error) {
			core.warning(error.message);
			return false;
		}
		return false;
	}
};

const fetchExternalConfigContent = async (octokit: Octokit, repository: string, scanner: string) => {
	const hasRepositoryAccess = await hasAccessToRepository(octokit, repository);

	if (!hasRepositoryAccess) {
		throw Error(`External token do not have access to repository Entur/${repository}`);
	}

	const YAML_EXTENSIONS = ["yml", "yaml"];
	const yamlPaths = YAML_EXTENSIONS.map((extension) => `.entur/security/${scanner}.${extension}`);

	const contentPromises = yamlPaths.map((filePath) =>
		octokit.rest.repos.getContent({
			owner: "Entur",
			repo: repository,
			path: filePath,
		}),
	);

	const results = await Promise.allSettled(contentPromises);

	const fulfilledResult = results.filter((result) => result.status === "fulfilled");

	if (fulfilledResult.length === 0) {
		core.info(`Found no external config from ${repository}`);
		return;
	}
	const response = fulfilledResult[0].value;

	if ("content" in response.data) {
		const contentBase64 = response.data.content.replaceAll("\n", "");
		return Buffer.from(contentBase64, "base64").toString("utf-8");
	}

	return;
};

const getExternalScannerConfig = async (scannerConfig: ScannerConfig | null, scanner: string, octokit: Octokit | undefined) => {
	if (octokit === undefined) {
		core.info("No external repository token found");
		return null;
	}

	if (!scannerConfig) return null;

	core.info("Get external scanner config");
	const externalRepository = scannerConfig.spec?.inherit;

	if (!externalRepository) {
		return null;
	}

	core.info(`Fetch external config from ${externalRepository}`);
	const content = await fetchExternalConfigContent(octokit, externalRepository, scanner);
	if (!content) return null;

	core.info(`Parse external config from ${externalRepository}`);
	return parseYamlConfig(content);
};

const readLocalConfig = (scannerType: string) => {
	core.info("Get scanner config");
	const YAML_EXTENSIONS = ["yml", "yaml"];
	let yamlPaths = YAML_EXTENSIONS.map((extension) => `.entur/security/${scannerType}.${extension}`);
	yamlPaths = yamlPaths.filter((path) => fs.existsSync(path));

	if (yamlPaths.length === 0) {
		core.info("No scanner config found in .entur/security/");
		return null;
	}

	if (yamlPaths.length > 1) {
		throw Error(`Expected 1 config file, found more than 1 ${scannerType} config`);
	}

	core.info(`Read config file from ${yamlPaths[0]}`);
	return fs.readFileSync(yamlPaths[0], "utf8");
};

const getLocalConfig = (scanner: string) => {
	const localConfig = readLocalConfig(scanner);

	if (localConfig === null) {
		return null;
	}

	core.info("Parse config file");
	return parseYamlConfig(localConfig);
};

const scannerConfigSchema = (scanner: string) => {
	const vulnerabilityId = scanner === "dockerscan" ? "cve" : "cwe";

	return {
		title: "ScannerConfig",
		type: "object",
		properties: {
			apiVersion: { enum: ["entur.io/securitytools/v1"] },
			kind: { enum: ["DockerScanConfig", "CodeScanConfig"] },
			metadata: {
				type: "object",
				properties: {
					id: { type: "string" },
					name: { type: "string" },
					owner: { type: "string" },
				},
				required: ["id"],
			},
			spec: {
				type: ["object", "null"],
				required: [],
				properties: {
					centralAllowlist: {
						type: "boolean",
					},
					inherit: {
						type: "string",
						pattern: "^[\\w.-]+$",
					},
					notifications: {
						type: "object",
						required: ["severityThreshold"],
						properties: {
							severityThreshold: { enum: ["low", "medium", "high", "critical"] },
							outputs: {
								type: "object",
								properties: {
									pullRequest: {
										type: "object",
										properties: {
											enabled: { type: "boolean" },
										},
									},
									slack: {
										type: "object",
										properties: {
											enabled: { type: "boolean" },
											channelId: { type: "string" },
										},
									},
								},
							},
						},
					},
					allowlist: {
						type: ["array", "null"],
						items: {
							type: "object",
							required: [vulnerabilityId, "comment", "reason"],
							properties: {
								cve: { type: "string" },
								cwe: { type: "string" },
								comment: { type: "string" },
								reason: { enum: ["false_positive", "wont_fix", "test"] },
							},
						},
					},
				},
			},
		},
		required: ["apiVersion", "kind", "metadata", "spec"],
	};
};

const validateScannerConfig = (scannerConfig: ScannerConfig, scanner: string) => {
	const ajvInstance = new Ajv({
		verbose: true,
	});

	const configSchema = scannerConfigSchema(scanner);

	const validate = ajvInstance.compile(configSchema);
	const isValid = validate(scannerConfig);

	if (!isValid) {
		throw Error(`Failed to validate ${scannerConfig.kind}\n ${JSON.stringify(validate.errors, null, 2)}`);
	}
};

const getCentralAllowlistConfig = (scannerType: string, fetchAllowlist = true) => {
	if (!fetchAllowlist) {
		core.info("Opting out of central allowlist");
		return null;
	}

	core.info("Looking for central allowlist config in ./central-allowlist");

	const YAML_EXTENSIONS = ["yml", "yaml"];
	const centralAllowlistPaths = YAML_EXTENSIONS.map((extension) => `./central-allowlist/.entur/security/${scannerType}.${extension}`);
	const existingPaths = centralAllowlistPaths.filter((path) => fs.existsSync(path));

	if (existingPaths.length === 0) {
		core.info("No central allowlist config found in ./central-allowlist/.entur/security/");
		return null;
	}

	if (existingPaths.length > 1) {
		core.warning(`Found multiple central allowlist configs: ${existingPaths.join(", ")}. Using first one.`);
	}

	const configPath = existingPaths[0];
	core.info(`Reading central allowlist config from ${configPath}`);

	try {
		const content = fs.readFileSync(configPath, "utf8");
		core.info("Parse central allowlist config");
		return parseYamlConfig(content);
	} catch (error) {
		if (error instanceof Error) {
			core.warning(`Failed to read central allowlist config: ${error.message}`);
			return null;
		}
		core.warning("Failed to read central allowlist config");
		return null;
	}
};

const getAllowlist = (config: ScannerConfig | null) => config?.spec?.allowlist ?? [];

const mergeConfigs = (local: ScannerConfig | null, external: ScannerConfig | null, central: ScannerConfig | null) => {
	const localOutput = local?.spec?.notifications?.outputs;
	const externalOutput = external?.spec?.notifications?.outputs;

	return {
		apiVersion: local?.apiVersion ?? "entur.io/securitytools/v1",
		kind: local?.kind ?? "",
		metadata: local?.metadata ?? undefined,
		spec: {
			inherit: local?.spec?.inherit ?? undefined,
			allowlist: [...getAllowlist(local), ...getAllowlist(external), ...getAllowlist(central)],
			notifications: {
				severityThreshold: "high",
				outputs: {
					slack: {
						enabled: localOutput?.slack?.enabled ?? externalOutput?.slack?.enabled ?? false,
						channelId: localOutput?.slack?.channelId ?? externalOutput?.slack?.channelId ?? "",
					},
					pullRequest: {
						enabled: localOutput?.pullRequest?.enabled ?? externalOutput?.pullRequest?.enabled ?? true,
					},
				},
			},
		},
	} as ScannerConfig;
};

const getScannerConfig = async (scannerType: string, octokitExternal?: Octokit) => {
	const localConfig = getLocalConfig(scannerType);
	const externalConfig = await getExternalScannerConfig(localConfig, scannerType, octokitExternal);

	if (localConfig) {
		validateScannerConfig(localConfig, scannerType);
	}

	if (externalConfig) {
		core.info("Validate external scanner config");
		validateScannerConfig(externalConfig, scannerType);
	}

	const fetchCentralAllowlist = localConfig?.spec?.centralAllowlist ?? externalConfig?.spec?.centralAllowlist ?? true;
	const centralConfig = getCentralAllowlistConfig(scannerType, fetchCentralAllowlist);

	if (centralConfig) {
		validateScannerConfig(centralConfig, scannerType);
	}

	return mergeConfigs(localConfig, externalConfig, centralConfig);
};

export { getScannerConfig, type ScannerConfig };
