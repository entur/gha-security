import { combineAllowlists } from "./allowlist.js";
import type { ScannerConfig, AllowlistDockerScan } from "./typedefs.js";
import * as fs from "node:fs";
import * as yaml from "yaml";

const generateGrypeConfig = (allowlist: AllowlistDockerScan[]) => {
	const GRYPE_CONFIG_FILE = ".grype.yaml";

	// comment and reason in allowlist is not being used at the moment.
	// it's available so we can easily put it into BigQuery.
	const vulnerabilities = new Set(allowlist.map((it) => it.cve));

	const grypeIgnoreList = Array.from(vulnerabilities).map((item) => {
		return { vulnerability: item };
	});

	const grypeConfig = { ignore: grypeIgnoreList };

	console.log("   [5.1] Converting grype config to YAML");
	const yamlGrype = yaml.stringify(grypeConfig);
	console.log(`   [5.2] Writing YAML config to ${GRYPE_CONFIG_FILE}`);
	fs.writeFileSync(".grype.yaml", yamlGrype);
};

const dismissDockerScanAlerts = (scannerConfig: ScannerConfig, externalScannerConfig?: ScannerConfig) => {
	const allowlist = combineAllowlists(scannerConfig, externalScannerConfig);

	if (allowlist.length > 0) {
		console.log("[5] Suppress Grype alerts");
		generateGrypeConfig(allowlist as AllowlistDockerScan[]);
		return;
	}

	console.log("[5] No allowlist found, skipping 'Suppress Grype alerts'");
	return;
};

export { dismissDockerScanAlerts };
