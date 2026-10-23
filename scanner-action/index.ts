import * as core from "@actions/core";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "octokit";
import { runAllowlist } from "./allowlist.js";
import { getOctokitThrottleConfig } from "./config.js";
import { ScannerNotifications } from "./notifications.js";
import { isScanType, type Scanner, scannerFromType } from "./scanner.js";
import { getScannerConfig } from "./scanner-config.js";

const main = async () => {
	try {
		const GITHUB_TOKEN = core.getInput("gh_token");
		const SCANNER_TYPE = core.getInput("scanner");
		const SLACK_BOT_TOKEN = core.getInput("slack_bot_token");
		const EXTERNAL_REPOSITORY_TOKEN = core.getInput("external_repository_token");

		const ThrottledOctokit = Octokit.plugin(throttling);

		let octokitExternal: Octokit | undefined;

		if (!isScanType(SCANNER_TYPE)) {
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
			auth: GITHUB_TOKEN,
			throttle: getOctokitThrottleConfig(),
		});

		const scanner: Scanner = scannerFromType(SCANNER_TYPE);
		const config = await getScannerConfig(SCANNER_TYPE, octokitExternal);
		await runAllowlist(octokitAction, SCANNER_TYPE, config);

		if (config.spec?.notifications) {
			const scannerNotifications = new ScannerNotifications(octokitAction, scanner, config.spec?.notifications, SLACK_BOT_TOKEN);
			await scannerNotifications.handleNotifications();
		} else {
			throw Error("Notification is undefined, unexpected!");
		}
	} catch (error) {
		if (error instanceof Error) {
			core.setFailed(error.message);
			return;
		}

		core.setFailed("Failed running scanner action");
	}
};

main();
