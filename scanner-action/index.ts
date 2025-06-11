import * as core from "@actions/core";
import * as github from "@actions/github";
import { type ThrottlingOptions, throttling } from "@octokit/plugin-throttling";
import { Octokit } from "octokit";
import { dismissCodeScanAlerts } from "./codescan.js";
import { dismissDockerScanAlerts } from "./dockerscan.js";
import { ScannerNotifications } from "./notifications.js";
import { setNotificationOutputs } from "./outputs.js";
import { getScannerConfigs } from "./scanner-config.js";
import type { ScannerConfig } from "./typedefs.js";

const getOctokitThrottleConfig = () => {
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

const runNotifications = async (octokitAction: Octokit, scannerType: string, scannerConfig?: ScannerConfig, externalScannerConfig?: ScannerConfig) => {
	const scannerNotifications = new ScannerNotifications(octokitAction, scannerType, scannerConfig?.spec?.notifications, externalScannerConfig?.spec?.notifications);

	core.info("Fetching notification alerts");
	const fetchedAlerts = await scannerNotifications.fetchNotificationAlerts();
	if (!fetchedAlerts) return;

	core.info("Setting notification outputs");
	setNotificationOutputs(scannerNotifications);
};

const runAllowlist = async (scannerConfig: ScannerConfig, scannerType: string, octokitAction: Octokit, externalScannerConfig?: ScannerConfig) => {
	switch (scannerType) {
		case "dockerscan":
			dismissDockerScanAlerts(scannerConfig, externalScannerConfig);
			break;

		case "codescan":
			await dismissCodeScanAlerts(scannerConfig, octokitAction, externalScannerConfig);
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
				throttle: getOctokitThrottleConfig(),
			});
		}

		const octokitAction = new ThrottledOctokit({
			auth: TOKEN,
			throttle: getOctokitThrottleConfig(),
		});

		if (!VALID_SCANNERS.includes(SCANNER_TYPE)) {
			core.setFailed(`Invalid scanner defined ${SCANNER_TYPE}`);
			return;
		}

		const configs = await getScannerConfigs(SCANNER_TYPE, octokitExternal);

		if (configs === undefined) return;

		if (configs === null) {
			await runNotifications(octokitAction, SCANNER_TYPE);
			return;
		}

		const { localConfig, externalConfig } = configs;

		await runAllowlist(localConfig, SCANNER_TYPE, octokitAction, externalConfig);
		await runNotifications(octokitAction, SCANNER_TYPE, localConfig, externalConfig);
	} catch (error) {
		if (error instanceof Error) {
			core.setFailed(error.message);
			return;
		}

		core.setFailed("Failed running scanner action");
	}
};

main();
