import { Octokit } from "octokit";
import * as core from "@actions/core";
import { GlobalConfig, ScannerConfig } from "./typedefs.js";
import { getExternalScannerConfig, getScannerConfig, validateScannerConfig } from "./scanner-config.js";

const getExternalConfig = async (scannerConfig: ScannerConfig, scannerType: string, octokitExternal?: Octokit) => {
	const externalRepository = scannerConfig.spec?.inherit

	if (!externalRepository) {
		return undefined
	}
	
	const externalScannerConfig = await getExternalScannerConfig(externalRepository, scannerType, octokitExternal);


	if (externalScannerConfig) {
		core.info("Validate external scanner config");
		validateScannerConfig(externalScannerConfig, scannerType);
	}

	return externalScannerConfig
}

const getCentralConfig = async (scannerConfig: ScannerConfig, octokitCentral?: Octokit) => {
	// Only implemented for dockerscan
	let scannerType = "dockerscan"
	let useCentralAllowlist = scannerConfig.spec?.centralAllowlist ?? true;

	if (!useCentralAllowlist)
		return undefined

	let centralScannerConfig = await getExternalScannerConfig("central-allowlist", scannerType, octokitCentral);


	if (centralScannerConfig) {
		core.info("Validate central scanner config");
		validateScannerConfig(centralScannerConfig, scannerType);
	}

	return centralScannerConfig
}

const getLocalConfig = (scannerType: string) => {
	const scannerConfig = getScannerConfig(scannerType);

    if (!scannerConfig) {
		core.info("Failed to get scanner config");
		return undefined;
	}

    core.info("Validate local config");
	validateScannerConfig(scannerConfig, scannerType);

    return scannerConfig
}

const getGlobalConfig = async (scannerType: string, octokitExternal?: Octokit, octokitCentral?: Octokit) => {

    const localConfig = getLocalConfig(scannerType);

    if (localConfig === undefined)
        return null

	let globalConfig: GlobalConfig = {
		localConfig: localConfig,
		externalConfig: undefined,
		centralConfig: undefined
	}

	if (scannerType == "dockerscan") {
		globalConfig.centralConfig = await getCentralConfig(localConfig, octokitCentral);
	}

	globalConfig.externalConfig = await getExternalConfig(localConfig, scannerType, octokitExternal);
	
	return globalConfig;
};

export { getGlobalConfig };