import * as core from "@actions/core";
import type { ThrottlingOptions } from "@octokit/plugin-throttling";

const getOctokitThrottleConfig = () => {
	const throttle: ThrottlingOptions = {
		onRateLimit: (retryAfter, options, _octokit, retryCount) => {
			core.warning(`Request quota exhausted for request ${options.method} ${options.url}`);

			if (retryCount < 1) {
				// only retries once
				core.info(`Retrying after ${retryAfter} seconds!`);
				return true;
			}
		},
		onSecondaryRateLimit: (_retryAfter, options, _octokit, _retryCount) => {
			// does not retry, only logs a warning
			core.warning(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
		},
	};
	return throttle;
};

export { getOctokitThrottleConfig };
