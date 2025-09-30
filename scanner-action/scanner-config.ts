import * as fs from "node:fs";
import * as core from "@actions/core";
import { Ajv } from "ajv";
import type { Octokit } from "octokit";
import * as yaml from "yaml";
import type { ScannerConfig } from "./typedefs.js";

const parseScannerConfig = (config: string) => {
	try {
		return yaml.parse(config) as ScannerConfig;
	} catch (error) {
		if (error instanceof Error) {
			core.warning(`Failed to parse yaml config: ${error.message}`);
			return;
		}

		core.warning("Failed to parse yaml config");
		return;
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
		throw Error(`Token do not have access to repository Entur/${repository}`);
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

const getExternalScannerConfig = async (externalRepository: string, scanner: string, octokit: Octokit | undefined) => {
	if (octokit === undefined) {
		core.info("No external repository token found");
		return;
	}

	core.info(`Fetch external config from ${externalRepository}`);
	const content = await fetchExternalConfigContent(octokit, externalRepository, scanner);
	if (!content) return;

	core.info(`Parse external config from ${externalRepository}`);
	return parseScannerConfig(content);
};

const getScannerContent = (scannerType: string) => {
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

const getScannerConfig = (scanner: string) => {
	const scannerContent = getScannerContent(scanner);

	if (scannerContent === null) {
		return null;
	}

	core.info("Parse config file");
	return parseScannerConfig(scannerContent);
};

const getScannerConfigSchema = (scanner: string) => {
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
								[vulnerabilityId]: { type: "string" },
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

	const scannerConfigSchema = getScannerConfigSchema(scanner);

	const validate = ajvInstance.compile(scannerConfigSchema);
	const isValid = validate(scannerConfig);

	if (!isValid) {
		throw Error(`Failed to validate ${scannerConfig.kind}\n ${JSON.stringify(validate.errors, null, 2)}`);
	}
};

export { getExternalScannerConfig, validateScannerConfig, getScannerConfig };
