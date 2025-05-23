import * as core from "@actions/core";
import type { ScannerConfig } from "./typedefs.js";

const setNotificationOutputs = (scanner: ScannerConfig) => {
	const slackEnabled = scanner.spec?.notifications?.outputs?.slack?.enabled ?? false;
	const slackChannelId = scanner.spec?.notifications?.outputs?.slack?.channelId ?? "";
	const pullRequestEnabled = scanner.spec?.notifications?.outputs?.pullRequest?.enabled ?? true;
	const severityThreshold = scanner.spec?.notifications?.severityThreshold ?? "high";

	core.setOutput("notification_severity_threshold", severityThreshold);
	core.setOutput("notification_slack_channel_id", slackChannelId);
	core.setOutput("notification_slack_enabled", slackEnabled ? "true" : "false");
	core.setOutput("notification_pull_request_enabled", pullRequestEnabled ? "true" : "false");
};

export { setNotificationOutputs };
