import * as core from "@actions/core";
import * as github from "@actions/github";
import { type ThrottlingOptions, throttling } from "@octokit/plugin-throttling";
import { Octokit } from "octokit";
import { dismissCodeScanAlerts } from "./codescan.js";
import { dismissDockerScanAlerts } from "./dockerscan.js";
import { getAlertsSeverityOverview } from "./notifications.js";
import { setNotificationOutputs } from "./outputs.js";
import { getExternalScannerConfig, getScannerConfig, validateScannerConfig } from "./scanner-config.js";
import type { ScannerConfig } from "./typedefs.js";

/**
 * Shared throttle configuration used for Octokit
 */
const getOctokitTrottleConfig = () => {
	const throttle: ThrottlingOptions = {
		onRateLimit: (retryAfter, options, octokit, retryCount) => {
			core.warning(`Request quota exhausted for request ${options.method} ${options.url}`);

			if (retryCount < 1) {
				// only retries once
				core.info(`Retrying after ${retryAfter} seconds!`);
				return true;
			}
		},
		onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
			// does not retry, only logs a warning
			core.warning(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
		},
	};
	return throttle;
};

const runNotifications = async (octokitAction: Octokit, scannerType: string, scannerConfig?: ScannerConfig | null) => {
	const overview = await getAlertsSeverityOverview(github.context.repo, octokitAction, scannerType);
	if (overview) setNotificationOutputs(overview, scannerConfig?.spec?.notifications);
};

const runAllowlist = async (scannerConfig: ScannerConfig, scannerType: string, octokitAction: Octokit, octokitExternal?: Octokit) => {
	const externalScannerConfig: ScannerConfig | undefined = await getExternalScannerConfig(scannerConfig, scannerType, octokitExternal);

	if (!externalScannerConfig) {
		core.info(`No external config found, skipping 'Validate external ${scannerType} config'`);
	} else {
		core.info(`Validate external ${scannerType} config`);
		if (!validateScannerConfig(externalScannerConfig, scannerType)) {
			core.setFailed(`Failed to validate external ${scannerType} config`);
			return;
		}
	}

	switch (scannerType) {
		case "dockerscan":
			dismissDockerScanAlerts(scannerConfig, externalScannerConfig);
			break;

		case "codescan":
			await dismissCodeScanAlerts(github.context.repo, scannerConfig, octokitAction, externalScannerConfig);
			break;

		default:
			break;
	}
};

const main = async () => {
	try {
		const TOKEN = core.getInput("token");
		const SCANNER_TYPE = core.getInput("scanner");
		const EXTERNAL_REPOSITORY_TOKEN = core.getInput("external-repository-token");
		const VALID_SCANNERS = ["dockerscan", "codescan"];

		const ThrottledOctokit = Octokit.plugin(throttling);

		let octokitExternal: Octokit | undefined = undefined;

		if (EXTERNAL_REPOSITORY_TOKEN !== "") {
			octokitExternal = new ThrottledOctokit({
				auth: EXTERNAL_REPOSITORY_TOKEN,
				throttle: getOctokitTrottleConfig(),
			});
		}

		const octokitAction = new ThrottledOctokit({
			auth: TOKEN,
			throttle: getOctokitTrottleConfig(),
		});

		if (!VALID_SCANNERS.includes(SCANNER_TYPE)) {
			core.setFailed(`Invalid scanner defined ${SCANNER_TYPE}`);
			return;
		}

		const scannerConfig = getScannerConfig(SCANNER_TYPE);

		if (scannerConfig) {
			core.info("Validate scanner config");
			if (!validateScannerConfig(scannerConfig, SCANNER_TYPE)) {
				core.setFailed("Scanner config validation failed");
				return;
			}
		}

		await runNotifications(octokitAction, SCANNER_TYPE, scannerConfig);

		if (!scannerConfig) {
			core.info(`Failed to get config for ${SCANNER_TYPE}`);
		} else {
			core.info("Starting allowlist job");
			await runAllowlist(scannerConfig, SCANNER_TYPE, octokitAction, octokitExternal);
		}
	} catch (error) {
		if (error instanceof Error) {
			core.setFailed(error.message);
		} else {
			core.setFailed("Failed running scanner action");
		}
	}
};

main();
