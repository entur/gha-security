import * as core from "@actions/core";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "octokit";
import { runAllowlist } from "./allowlist.js";
import { getOctokitThrottleConfig } from "./config.js";
import { runNotifications } from "./notifications.js";
import { getScannerConfig } from "./scanner-config.js";

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
