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

const fetchExternalConfigContent = async (octokit: Octokit, repository: string, scanner: string) => {
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

const getExternalScannerConfig = async (scannerConfig: ScannerConfig, scanner: string, octokit: Octokit | undefined) => {
	if (octokit === undefined) {
		core.info("No external repository token found");
		return;
	}

	core.info("Get external scanner config");
	const externalRepository = scannerConfig.spec?.inherit;

	if (!externalRepository) {
		return;
	}

	core.info(`Fetch external config from ${externalRepository}`);
	const content = await fetchExternalConfigContent(octokit, externalRepository, scanner);
	if (!content) return;

	core.info(`Parse external config from ${externalRepository}`);
	return parseScannerConfig(content);
};

const getScannerConfig = (scanner: string) => {
	core.info("Get scanner config");
	const YAML_EXTENSIONS = ["yml", "yaml"];
	const filePathList = YAML_EXTENSIONS.map((extension) => `.entur/security/${scanner}.${extension}`);
	core.info(`Get config file from ${JSON.stringify(filePathList)}`);
	const existingPathList = filePathList.filter((path) => fs.existsSync(path));

	if (existingPathList.length === 0) {
		core.info("No scanner config found");
		return undefined;
	}

	core.info(`Read config file ${existingPathList[0]}`);
	const fileContent = fs.readFileSync(existingPathList[0], "utf8");

	core.info(`Parse config file ${existingPathList[0]}`);
	return parseScannerConfig(fileContent);
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
				required: ["allowlist"],
				properties: {
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
		core.info(`Failed to validate ${scannerConfig.kind}`);
		core.info(JSON.stringify(validate.errors, null, 2));
		return false;
	}
	return true;
};

const getScannerConfigs = async (scannerType: string, octokitExternal?: Octokit) => {
	const scannerConfig = getScannerConfig(scannerType);

	if (!scannerConfig) {
		core.info("Failed to get scanner config");
		return null;
	}

	core.info("Validate scanner config");

	if (!validateScannerConfig(scannerConfig, scannerType)) {
		core.setFailed("Failed to validate local scanner config");
		return undefined;
	}

	const externalScannerConfig = await getExternalScannerConfig(scannerConfig, scannerType, octokitExternal);

	if (!externalScannerConfig) {
		core.info("No external config found");
		return { localConfig: scannerConfig, externalConfig: undefined };
	}

	core.info("Validate external scanner config");
	if (!validateScannerConfig(externalScannerConfig, scannerType)) {
		core.setFailed("Failed to validate external scanner config");
		return undefined;
	}

	return { localConfig: scannerConfig, externalConfig: externalScannerConfig };
};

export { getScannerConfigs };
