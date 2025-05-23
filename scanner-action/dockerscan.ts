import * as fs from "node:fs";
import * as core from "@actions/core";
import * as yaml from "yaml";
import { combineAllowlists } from "./allowlist.js";
import type { AllowlistDockerScan, ScannerConfig } from "./typedefs.js";

const generateGrypeConfig = (allowlist: AllowlistDockerScan[]) => {
	const GRYPE_CONFIG_FILE = ".grype.yaml";

	// comment and reason in allowlist is not being used at the moment.
	// it's available so we can easily put it into BigQuery.
	const vulnerabilities = new Set(allowlist.map((it) => it.cve));

	const grypeIgnoreList = Array.from(vulnerabilities).map((item) => {
		return { vulnerability: item };
	});

	const grypeConfig = { ignore: grypeIgnoreList };

	core.info("   [5.1] Converting grype config to YAML");
	const yamlGrype = yaml.stringify(grypeConfig);
	core.info(`   [5.2] Writing YAML config to ${GRYPE_CONFIG_FILE}`);
	fs.writeFileSync(".grype.yaml", yamlGrype);
};

const dismissDockerScanAlerts = (scannerConfig: ScannerConfig, externalScannerConfig?: ScannerConfig) => {
	const allowlist = combineAllowlists(scannerConfig, externalScannerConfig);

	if (allowlist.length > 0) {
		core.info("[5] Suppress Grype alerts");
		generateGrypeConfig(allowlist as AllowlistDockerScan[]);
		return;
	}

	core.info("[5] No allowlist found, skipping 'Suppress Grype alerts'");
	return;
};

export { dismissDockerScanAlerts };
