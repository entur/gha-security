import * as fs from "node:fs";
import * as core from "@actions/core";
import * as github from "@actions/github";
import type { WebClient } from "@slack/web-api";
import type { Octokit } from "octokit";
import { removeIssueComment, sendIssueComment } from "./github-issues.js";
import type { SeverityLevel } from "./github-security.js";
import type { Scanner } from "./scanner.js";
import { ScannerReport } from "./scanner-report.js";

interface SlackNotification {
	enabled?: boolean;
	channelId?: string;
}

interface PullRequestNotification {
	enabled?: boolean;
}

interface NotificationOutputs {
	pullRequest?: PullRequestNotification;
	slack?: SlackNotification;
}

interface Notifications {
	severityThreshold: SeverityLevel;
	outputs?: NotificationOutputs;
}

class ScannerNotifications {
	private octokit: Octokit;
	private config: Notifications;
	private slackWebClient?: WebClient;
	private scannerReport: ScannerReport;

	constructor(octokit: Octokit, scanner: Scanner, config: Notifications, slackWebClient?: WebClient) {
		this.octokit = octokit;
		this.config = config;
		this.slackWebClient = slackWebClient;
		this.scannerReport = new ScannerReport(octokit, scanner, config);
	}

	private get slackEnabled() {
		return this.config.outputs?.slack?.enabled ?? false;
	}

	private get pullRequestEnabled() {
		return this.config.outputs?.pullRequest?.enabled ?? true;
	}

	private get slackChannelId() {
		return this.config.outputs?.slack?.channelId ?? undefined;
	}

	private get isPullRequest() {
		return this.pullRequestEnabled && github.context.eventName === "pull_request";
	}

	private get pullRequestIssue() {
		return { issue_number: github.context.issue.number, owner: github.context.issue.owner, repo: github.context.issue.repo };
	}

	private async sendSlackNotification() {
		if (!this.slackWebClient || !this.slackChannelId) return;

		await this.slackWebClient.chat.postMessage({
			channel: this.slackChannelId,
			blocks: this.scannerReport.slackBlocks,
		});
	}

	private writeJobSummary() {
		const summaryFile = process.env.GITHUB_STEP_SUMMARY;

		if (summaryFile) {
			fs.appendFileSync(summaryFile, this.scannerReport.markdown, "utf8");
		}
	}

	public async handleNotifications() {
		await this.scannerReport.initialize();

		if (this.scannerReport.hasAlertWithinThreshold) {
			core.info("Writing to job summary");
			this.writeJobSummary();

			if (this.isPullRequest) {
				await sendIssueComment(this.pullRequestIssue, this.scannerReport.markdown, this.octokit);
			}

			if (this.slackEnabled) {
				await this.sendSlackNotification();
			}
		}

		if (this.isPullRequest) {
			await removeIssueComment(this.pullRequestIssue, this.scannerReport.scannerComment, this.octokit);
		}
	}
}

export { type Notifications, ScannerNotifications };
