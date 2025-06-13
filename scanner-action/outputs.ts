import * as core from "@actions/core";
import type { ScannerNotifications } from "./notifications.js";

const outputBool = (value: boolean) => (value ? "True" : "False");

const setNotificationOutputs = (scannerNotifications: ScannerNotifications) => {
	core.setOutput("notification_severity_alert_found", outputBool(scannerNotifications.alertsFound));
	core.setOutput("notification_severity_overview", scannerNotifications.overview);
	core.setOutput("notification_severity_threshold", scannerNotifications.severityThreshold);
	core.setOutput("notification_severity_filter", scannerNotifications.severityFilter.join(","));
	core.setOutput("notification_slack_channel_id", scannerNotifications.slack.channelId);
	core.setOutput("notification_slack_enabled", outputBool(scannerNotifications.slack.enabled));
	core.setOutput("notification_pull_request_enabled", outputBool(scannerNotifications.pullRequest.enabled));
};

export { setNotificationOutputs };
