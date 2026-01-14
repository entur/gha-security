import * as core from "@actions/core";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "octokit";
import { runAllowlist } from "./allowlist.js";
import { ScannerNotifications } from "./notifications.js";
import { getOctokitThrottleConfig } from "./octokit-throttle.js";
import { setNotificationOutputs } from "./outputs.js";
import { getScannerConfigs } from "./scanner-config.js";
import type { ScannerConfig } from "./typedefs.js";

const runNotifications = async (octokitAction: Octokit, scannerType: string, scannerConfig?: ScannerConfig, externalScannerConfig?: ScannerConfig) => {
	const scannerNotifications = new ScannerNotifications(octokitAction, scannerType, scannerConfig?.spec?.notifications, externalScannerConfig?.spec?.notifications);

	core.info("Fetching notification alerts");
	const fetchedAlerts = await scannerNotifications.fetchNotificationAlerts();
	if (!fetchedAlerts) return;

	core.info("Setting notification outputs");
	setNotificationOutputs(scannerNotifications);
};

const main = async () => {
	try {
		const TOKEN = core.getInput("token");
		const SCANNER_TYPE = core.getInput("scanner");
		const EXTERNAL_REPOSITORY_TOKEN = core.getInput("external-repository-token");
		const VALID_SCANNERS = ["dockerscan", "codescan"];

		const ThrottledOctokit = Octokit.plugin(throttling);

		let octokitExternal: Octokit | undefined = undefined;

		if (!VALID_SCANNERS.includes(SCANNER_TYPE)) {
			core.setFailed(`Invalid scanner defined ${SCANNER_TYPE}`);
			return;
		}

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

		const configs = await getScannerConfigs(SCANNER_TYPE, octokitExternal);

		if (configs === undefined) return;

		if (configs === null) {
			await runNotifications(octokitAction, SCANNER_TYPE);
			return;
		}

		const { localConfig, externalConfig, centralConfig } = configs;

		await runAllowlist(octokitAction, SCANNER_TYPE, localConfig, externalConfig, centralConfig);
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
