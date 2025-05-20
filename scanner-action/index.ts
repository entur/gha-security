import * as core from "@actions/core";
import * as github from "@actions/github";
import { type ThrottlingOptions, throttling } from "@octokit/plugin-throttling";
import { Octokit } from "octokit";
import { dismissCodeScanAlerts } from "./codescan.js";
import { dismissDockerScanAlerts } from "./dockerscan.js";
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

const main = async () => {
	try {
		const TOKEN = core.getInput("token");
		const REPOSITORY = github.context.repo.repo;
		const SCANNER = core.getInput("scanner");
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

		if (!VALID_SCANNERS.includes(SCANNER)) {
			core.setFailed(`Invalid scanner defined ${SCANNER}`);
			return;
		}

		const scannerConfig = getScannerConfig(SCANNER);

		if (!scannerConfig) {
			core.info(`[SKIP] failed to get yaml config for ${SCANNER}`);
			return;
		}

		core.info("[2] Validate scanner config");
		if (!validateScannerConfig(scannerConfig, SCANNER)) {
			core.setFailed(`Failed to validate ${SCANNER} config`);
			return;
		}

		const externalScannerConfig: ScannerConfig | undefined = await getExternalScannerConfig(scannerConfig, SCANNER, octokitExternal);

		if (!externalScannerConfig) {
			core.info(`[4] No external config found, skipping 'Validate external ${SCANNER} config'`);
		} else {
			core.info(`[4] Validate external ${SCANNER} config`);
			if (!validateScannerConfig(externalScannerConfig, SCANNER)) {
				core.setFailed(`Failed to validate external ${SCANNER} config`);
				return;
			}
		}

		switch (SCANNER) {
			case "dockerscan":
				dismissDockerScanAlerts(scannerConfig, externalScannerConfig);
				break;

			case "codescan":
				dismissCodeScanAlerts(REPOSITORY, scannerConfig, octokitAction, externalScannerConfig);
				break;

			default:
				break;
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
