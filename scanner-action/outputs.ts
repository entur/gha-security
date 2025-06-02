import * as core from "@actions/core";
import { formatOverview, getSeverityFilter } from "./notifications.js";
import type { Notifications } from "./typedefs.js";

const outputBool = (value: boolean) => (value ? "True" : "False");

const setNotificationOutputs = (overview: { low: number; medium: number; high: number; critical: number }, notifications?: Notifications) => {
	const slackEnabled = notifications?.outputs?.slack?.enabled ?? false;
	const slackChannelId = notifications?.outputs?.slack?.channelId ?? "";

	const pullRequestEnabled = notifications?.outputs?.pullRequest?.enabled ?? true;

	const severityThreshold = notifications?.severityThreshold ?? "high";
	const severityFilter = getSeverityFilter(severityThreshold);
	const severityAlertFound = severityFilter.some((it) => overview[it] > 0);

	if (slackEnabled && slackChannelId === "") {
		core.setFailed("Missing slackChannelId from config");
		return;
	}

	core.setOutput("notification_severity_alert_found", outputBool(severityAlertFound));
	core.setOutput("notification_severity_overview", overview);
	core.setOutput("notification_severity_threshold", severityThreshold);
	core.setOutput("notification_severity_filter", severityFilter.join(","));
	core.setOutput("notification_slack_channel_id", slackChannelId);
	core.setOutput("notification_slack_enabled", outputBool(slackEnabled));
	core.setOutput("notification_pull_request_enabled", outputBool(pullRequestEnabled));
};

export { setNotificationOutputs };
