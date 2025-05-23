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
		core.info(`   [SKIP] Found no external config from ${repository}`);
		return;
	}
	const response = fulfilledResult[0].value;

	if ("content" in response.data) {
		const contentBase64 = response.data.content.replaceAll("\n", "");
		const configContent = Buffer.from(contentBase64, "base64").toString("utf-8");
		return configContent;
	}

	return;
};

const getExternalScannerConfig = async (scannerConfig: ScannerConfig, scanner: string, octokit: Octokit | undefined) => {
	if (octokit === undefined) {
		core.info("[3] No external repository token found, skipping 'Get external scanner config'");
		return;
	}

	core.info("[3] Get external scanner config");
	const externalRepository = scannerConfig.spec?.inherit;

	if (!externalRepository) {
		return;
	}

	core.info(`   [3.1] Fetch external config from ${externalRepository}`);
	const content = await fetchExternalConfigContent(octokit, externalRepository, scanner);
	if (!content) return;

	core.info(`   [3.2] Parse external config from ${externalRepository}`);
	return parseScannerConfig(content);
};

const getScannerConfig = (scanner: string) => {
	core.info("[1] Get scanner config");
	const YAML_EXTENSIONS = ["yml", "yaml"];
	const filePathList = YAML_EXTENSIONS.map((extension) => `.entur/security/${scanner}.${extension}`);
	core.info(`   [1.1] Get config file from ${JSON.stringify(filePathList)}`);
	const existingPathList = filePathList.filter((path) => fs.existsSync(path));

	if (existingPathList.length === 0) {
		core.info("[SKIP] No file found");
		return null;
	}

	core.info(`   [1.2] Read config file ${existingPathList[0]}`);
	const fileContent = fs.readFileSync(existingPathList[0], "utf8");

	core.info(`   [1.3] Parse config file ${existingPathList[0]}`);
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
							severityThreshold: { type: "string" },
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
		core.info(`[VALIDATE] Failed to validate ${scannerConfig.kind}`);
		core.info(JSON.stringify(validate.errors, null, 2));
		return false;
	}
	return true;
};

export { getExternalScannerConfig, getScannerConfig, validateScannerConfig };
