import * as github from "@actions/github";
import type { Octokit } from "octokit";
import { getAlerts, type PartialCodeScanningAlert, type SeverityLevel } from "./github-security.js";
import type { Notifications } from "./notifications.js";
import type { Scanner } from "./scanner.js";

class ScannerReport {
	private octokit: Octokit;
	private scanner: Scanner;
	private codeScanningAlerts: PartialCodeScanningAlert[];
	private fetchedAlerts: boolean;
	private severityLevels: SeverityLevel[];
	private notificationsConfig: Notifications;

	constructor(octokit: Octokit, scanner: Scanner, config: Notifications) {
		this.octokit = octokit;
		this.severityLevels = ["low", "medium", "high", "critical"];
		this.codeScanningAlerts = [];
		this.fetchedAlerts = false;
		this.scanner = scanner;
		this.notificationsConfig = config;
	}

	private get allowListDocumentationUrl() {
		const fileNameWithSectionEnd = this.scanner.name === "dockerscan" ? "README-docker-scan.md#allowlisting-vulnerabilities" : "README-code-scan.md#allowlists";
		return `https://github.com/entur/gha-security/blob/main/${fileNameWithSectionEnd}`;
	}

	private get header() {
		return `${this.scanner.name} - Alert(s) found with threshold matching severity ${this.notificationsConfig.severityThreshold}`;
	}

	private get overviewAsList() {
		return Object.entries(this.overview)
			.map(([key, value]) => `- ${key}: ${value} `)
			.join("\n");
	}

	private get codeScanningResultUrl() {
		const githubRepository = `${github.context.repo.owner}/${github.context.repo.repo}`;
		return `https://github.com/${githubRepository}/security/code-scanning?query=is:open+ref:${github.context.ref}+tool:${this.scanner.tool}`;
	}

	private get overview() {
		const overview = {
			critical: 0,
			high: 0,
			medium: 0,
			low: 0,
		};

		const alertsWithSecurityLevel = this.codeScanningAlerts
			.filter((it) => it.rule.security_severity_level !== null && it.rule.security_severity_level !== undefined)
			.map((it) => it.rule.security_severity_level);

		for (const severity of this.severityLevels) {
			overview[severity] = alertsWithSecurityLevel.filter((it) => it === severity).length;
		}

		return overview;
	}

	private get severityFilter() {
		const severityIndex = this.severityLevels.indexOf(<"low" | "medium" | "high" | "critical">this.notificationsConfig.severityThreshold);
		return this.severityLevels.slice(severityIndex) as SeverityLevel[];
	}

	private async fetchAlerts() {
		this.codeScanningAlerts = (await getAlerts(this.octokit, github.context.ref, github.context.repo, this.scanner.tool)) ?? [];
		this.fetchedAlerts = true;
	}

	async initialize() {
		if (!this.fetchedAlerts) await this.fetchAlerts();
	}

	public get hasAlertWithinThreshold() {
		return this.severityFilter.some((it) => this.overview[it] > 0);
	}

	public get scannerComment() {
		return `<!-- gha-security:${this.scanner.name} -->`;
	}

	public get markdown() {
		return `## ${this.header}
### Results  
${this.overviewAsList}

${this.scanner.prettyName} Report can be found [here](${this.codeScanningResultUrl})  
### Allowlist  
Use the allowlist if you want to ignore vulnerabilities that do not affect the repository.  
See the [${this.scanner.prettyName} documentation](${this.allowListDocumentationUrl}) on how to use allowlist.  
${this.scannerComment}`;
	}
}

export { ScannerReport };
