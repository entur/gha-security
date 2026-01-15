import * as core from "@actions/core";
import * as github from "@actions/github";
import { type Octokit, RequestError } from "octokit";
import type { Notifications, PartialCodeScanningAlert, PartialCodeScanningAlertResponse, SeverityLevel } from "./typedefs.js";
import { getAlerts } from "./github-security.js";

class ScannerNotifications {
	severityThreshold: SeverityLevel;
	octokit: Octokit;
	scannerType: string;
	fetchedNotificationAlerts: boolean;
	notificationAlerts: PartialCodeScanningAlert[];
	severityList: SeverityLevel[];
	toolName: string;
	config: Notifications;

	constructor(octokit: Octokit, scannerType: string, config: Notifications) {
		this.fetchedNotificationAlerts = false;
		this.notificationAlerts = [];
		this.scannerType = scannerType;
		this.octokit = octokit;
		this.severityList = ["low", "medium", "high", "critical"];
		this.toolName = this.scannerType === "dockerscan" ? "grype" : "codeql";
		this.config = config;
		this.severityThreshold = config.severityThreshold;
	}

	get severityFilter() {
		const severityIndex = this.severityList.indexOf(<"low" | "medium" | "high" | "critical">this.severityThreshold);
		return this.severityList.slice(severityIndex) as SeverityLevel[];
	}

	get overview() {
		const overview = {
			critical: 0,
			high: 0,
			medium: 0,
			low: 0,
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
		return getAlerts(this.octokit, github.context.ref, github.context.repo, this.toolName)
	}
}

export { ScannerNotifications };
