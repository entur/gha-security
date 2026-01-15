import * as core from "@actions/core";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "octokit";
import { runAllowlist } from "./allowlist.js";
import { getOctokitThrottleConfig } from "./config.js";
import { ScannerNotifications } from "./notifications.js";
import { setNotificationOutputs } from "./outputs.js";
import { type ScannerConfig, getScannerConfig } from "./scanner-config.js";

const runNotifications = async (octokitAction: Octokit, scannerType: string, scannerConfig: ScannerConfig) => {
	const notifications = scannerConfig.spec?.notifications;

	if (!notifications) {
		throw Error("Notification is undefined, unexpected!");
	}

	const scannerNotifications = new ScannerNotifications(octokitAction, scannerType, notifications);

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

		const config = await getScannerConfig(SCANNER_TYPE, octokitExternal);
		await runAllowlist(octokitAction, SCANNER_TYPE, config);
		await runNotifications(octokitAction, SCANNER_TYPE, config);
	} catch (error) {
		if (error instanceof Error) {
			core.setFailed(error.message);
			return;
		}

		core.setFailed("Failed running scanner action");
	}
};

main();
