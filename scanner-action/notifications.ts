import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "octokit";
import type { Notifications, PartialCodeScanningAlert, PartialCodeScanningAlertResponse, SeverityLevel } from "./typedefs.js";

class ScannerNotifications {
	severityThreshold: SeverityLevel;
	slack: {
		enabled: boolean;
		channelId: string;
	};
	pullRequest: {
		enabled: boolean;
	};
	octokit: Octokit;
	scannerType: string;
	fetchedNotificationAlerts: boolean;
	notificationAlerts: PartialCodeScanningAlert[];
	severityList: SeverityLevel[];
	toolName: string;

	constructor(octokit: Octokit, scannerType: string, local?: Notifications, external?: Notifications) {
		this.fetchedNotificationAlerts = false;
		this.notificationAlerts = [];
		this.scannerType = scannerType;
		this.octokit = octokit;
		this.severityList = ["low", "medium", "high", "critical"];
		this.toolName = this.scannerType === "dockerscan" ? "grype" : "codeql";

		// local notifications values take priority
		this.slack = {
			enabled: local?.outputs?.slack?.enabled ?? external?.outputs?.slack?.enabled ?? false,
			channelId: local?.outputs?.slack?.channelId ?? external?.outputs?.slack?.channelId ?? "",
		};

		this.pullRequest = {
			enabled: local?.outputs?.pullRequest?.enabled ?? external?.outputs?.pullRequest?.enabled ?? true,
		};
		this.severityThreshold = local?.severityThreshold ?? external?.severityThreshold ?? "high";

		if (this.slack && this.slack.channelId === "") {
			throw Error("Missing slack channelId in scanner config");
		}
	}

	get severityFilter() {
		const severityIndex = this.severityList.indexOf(<"low" | "medium" | "high" | "critical">this.severityThreshold);
		return this.severityList.slice(severityIndex) as SeverityLevel[];
	}

	get overview() {
		const overview = {
			low: 0,
			medium: 0,
			high: 0,
			critical: 0,
		};

		const alertsWithSecurityLevel = this.notificationAlerts
			.filter((it) => it.rule.security_severity_level !== null && it.rule.security_severity_level !== undefined)
			.map((it) => it.rule.security_severity_level);

		for (const severity of this.severityList) {
			overview[severity] = alertsWithSecurityLevel.filter((it) => it === severity).length;
		}

		return overview;
	}

	get alertsFound() {
		return this.severityFilter.some((it) => this.overview[it] > 0);
	}

	async fetchNotificationAlerts() {
		try {
			this.notificationAlerts = await this.octokit.paginate(
				this.octokit.rest.codeScanning.listAlertsForRepo,
				{
					owner: github.context.repo.owner,
					repo: github.context.repo.repo,
					ref: github.context.ref,
					per_page: 100,
					state: "open",
					tool_name: this.toolName,
				},
				(response: PartialCodeScanningAlertResponse) => response.data,
			);
			return true;
		} catch (error) {
			if (error instanceof Error) {
				throw Error(`Failed to fetch notification alerts: ${error.message}`);
			}

			throw Error("Failed to fetch notification alerts");
		}
	}
}

export { ScannerNotifications };
