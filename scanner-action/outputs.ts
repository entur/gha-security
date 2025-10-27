import * as core from "@actions/core";
import * as github from "@actions/github";
import { ScannerNotifications } from "./notifications.js";

const outputBool = (value: boolean) => (value ? "True" : "False");

const getGithubRepository = () => {
	return `${github.context.repo.owner}/${github.context.repo.repo}`;
};

const toTextList = (object: Record<string, number>) => {
	/* Generate a list
	- critical: 0
	- high: 0
	...
	*/
	return Object.entries(object)
		.map(([key, value]) => `- ${key}: ${value} `)
		.join("\n");
};

const createMarkdown = (scannerNotifications: ScannerNotifications)  => {
	const scannerReport = getScannerReport(scannerNotifications)
	return `## ${scannerReport.header}
### Results
${scannerReport.resultsList}  

${scannerReport.scannerTypeName} Report can be found [here](${scannerReport.resultsUrl})
### Allowlist
Use the allowlist if you want to ignore vulnerabilities that do not affect the repository.
See the [${scannerReport.scannerTypeName} documentation](${scannerReport.allowListDocumentationUrl}) on how to use allowlist.`
}

const getScannerReport = (scannerNotifications: ScannerNotifications) => {
	const scannerType = scannerNotifications.scannerType;
	const scannerTypeName = scannerType === "dockerscan" ? "Docker Scan" : "Code Scan";
	
	const githubRef = github.context.ref;
	const githubRepository = getGithubRepository();

	const notificationOverviewList = toTextList(scannerNotifications.overview);
	const githubCodeScanningReportUrl = `https://github.com/${githubRepository}/security/code-scanning?query=is:open+ref:${githubRef}+tool:${scannerNotifications.toolName}`;
	const allowlistReadme = scannerType === "dockerscan" ? "README-docker-scan.md#allowlisting-vulnerabilities" : "README-code-scan.md#allowlists";

	return {
		header: `${scannerTypeName} - Alert(s) found with threshold matching severity ${scannerNotifications.severityThreshold}`,
		resultsList: notificationOverviewList,
		resultsUrl: githubCodeScanningReportUrl,
		allowListDocumentationUrl: `https://github.com/entur/gha-security/blob/main/${allowlistReadme}`,
		scannerTypeName: scannerTypeName
	}

}

const createSlackBlock = (scannerNotifications: ScannerNotifications) => {
	const scannerReport = getScannerReport(scannerNotifications)
	const githubRepository = getGithubRepository();

	return {
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: `${scannerReport.header} on ${githubRepository}`,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Results*
${scannerReport.resultsList}  
${scannerReport.scannerTypeName} Report can be found <${scannerReport.resultsUrl}|here>`,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Allowlist*
Use the allowlist if you want to ignore vulnerabilities that do not affect the repository. 
See the <${scannerReport.allowListDocumentationUrl}|${scannerReport.scannerTypeName} documentation> on how to use allowlist."`,
				},
			},
		],
	};
};

const setNotificationOutputs = (scannerNotifications: ScannerNotifications) => {
	core.setOutput("notification_severity_alert_found", outputBool(scannerNotifications.alertsFound));
	core.setOutput("notification_severity_overview", scannerNotifications.overview);
	core.setOutput("notification_severity_threshold", scannerNotifications.severityThreshold);
	core.setOutput("notification_severity_filter", scannerNotifications.severityFilter.join(","));
	core.setOutput("notification_slack_channel_id", scannerNotifications.slack.channelId);
	core.setOutput("notification_slack_enabled", outputBool(scannerNotifications.slack.enabled));
	core.setOutput("notification_slack_block", createSlackBlock(scannerNotifications));
	core.setOutput("notification_pull_request_enabled", outputBool(scannerNotifications.pullRequest.enabled));
	core.setOutput("notification_markdown", createMarkdown(scannerNotifications));
};

export { setNotificationOutputs };
