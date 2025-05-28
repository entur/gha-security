import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "octokit";
import type { GithubRepo, PartialCodeScanningAlertResponse, SeverityLevel } from "./typedefs.js";

const getNotificationAlerts = async (githubRepo: GithubRepo, octokit: Octokit, scanner: string) => {
	const toolName = scanner === "dockerscan" ? "grype" : "codeql";
	const ref = github.context.ref;
	try {
		return await octokit.paginate(
			octokit.rest.codeScanning.listAlertsForRepo,
			{
				owner: githubRepo.owner,
				repo: githubRepo.repo,
				ref,
				per_page: 100,
				state: "open",
				tool_name: toolName,
			},
			(response: PartialCodeScanningAlertResponse) => response.data,
		);
	} catch (error) {
		if (error instanceof Error) {
			core.setFailed(`Failed to fetch notification alerts: ${error.message}`);
		} else {
			core.setFailed("Failed to fetch notification alerts");
		}

		return null;
	}
};

const getAlertsSeverityOverview = async (githubRepo: GithubRepo, octokit: Octokit, scanner: string) => {
	const notificationAlerts = await getNotificationAlerts(githubRepo, octokit, scanner);

	if (!notificationAlerts) return null;

	const severityList: SeverityLevel[] = ["low", "medium", "high", "critical"];

	const overview: { low: number; medium: number; high: number; critical: number } = {
		low: 0,
		medium: 0,
		high: 0,
		critical: 0,
	};

	const alertsWithSecurityLevel = notificationAlerts
		.filter((it) => it.rule.security_severity_level !== null && it.rule.security_severity_level !== undefined)
		.map((it) => it.rule.security_severity_level);

	for (const severity of severityList) {
		overview[severity] = alertsWithSecurityLevel.filter((it) => it === severity).length;
	}

	return overview;
};

const getSeverityFilter = (severityThreshold: string) => {
	const severityList: SeverityLevel[] = ["low", "medium", "high", "critical"];
	const severityIndex = severityList.indexOf(<"low" | "medium" | "high" | "critical">severityThreshold);
	return severityList.splice(severityIndex) as SeverityLevel[];
};

const formatOverview = (overview: { low: number; medium: number; high: number; critical: number }) => {
	return Object.entries(overview)
		.map((key, value) => `- ${key}: ${value}`)
		.join("\n");
};

export { getAlertsSeverityOverview, getSeverityFilter, formatOverview };
