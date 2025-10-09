import * as fs from "node:fs";
import * as core from "@actions/core";
import * as yaml from "yaml";
import type { AllowlistDockerScan, ScannerConfig } from "./typedefs.js";

const convertToCveMap = (localAllowlist: AllowlistDockerScan[], externalAllowlist: AllowlistDockerScan[], centralAllowlist: AllowlistDockerScan[]) => {
	const cveMap: Map<string, { comment: string; reason: string }> = new Map();

	for (const entry of centralAllowlist) {
		cveMap.set(entry.cve, { comment: entry.comment, reason: entry.reason });
	}

	// comment and reason in allowlist is not being used at the moment.
	// it's available, so we can easily put it into BigQuery.
	for (const entry of externalAllowlist) {
		cveMap.set(entry.cve, { comment: entry.comment, reason: entry.reason });
	}

	// Local Priority
	for (const entry of localAllowlist) {
		cveMap.set(entry.cve, { comment: entry.comment, reason: entry.reason });
	}

	return cveMap;
};

const generateGrypeConfig = (localAllowlist: AllowlistDockerScan[], externalAllowlist: AllowlistDockerScan[], centralAllowlist: AllowlistDockerScan[]) => {
	const GRYPE_CONFIG_FILE = ".grype.yaml";

	const cveMap = convertToCveMap(localAllowlist, externalAllowlist, centralAllowlist);

	const grypeIgnoreList = Array.from(cveMap.keys()).map((item) => {
		return { vulnerability: item };
	});

	const grypeConfig = { ignore: grypeIgnoreList };

	core.info("Converting grype config to YAML");
	const yamlGrype = yaml.stringify(grypeConfig);
	core.info(`Writing YAML grype config to ${GRYPE_CONFIG_FILE}`);
	fs.writeFileSync(".grype.yaml", yamlGrype);
};

const dismissDockerScanAlerts = (scannerConfig: ScannerConfig, externalScannerConfig?: ScannerConfig, centralScannerConfig?: ScannerConfig) => {
	const localAllowlist = (scannerConfig.spec?.allowlist ?? []) as AllowlistDockerScan[];
	const externalAllowlist = (externalScannerConfig?.spec?.allowlist ?? []) as AllowlistDockerScan[];
	const centralAllowlist = (centralScannerConfig?.spec?.allowlist ?? []) as AllowlistDockerScan[];

	if (localAllowlist.length === 0 && externalAllowlist.length === 0 && centralAllowlist.length === 0) {
		core.info("No allowlist found");
		return;
	}

	generateGrypeConfig(localAllowlist, externalAllowlist, centralAllowlist);
};

export { dismissDockerScanAlerts };
