import * as fs from "node:fs";
import * as core from "@actions/core";
import * as github from "@actions/github";
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
	private slackToken: string;
	private scannerReport: ScannerReport;

	constructor(octokit: Octokit, scanner: Scanner, config: Notifications, slackToken: string) {
		this.octokit = octokit;
		this.config = config;
		this.slackToken = slackToken;
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
		if (!this.slackToken || !this.slackChannelId) return;

		const response = await fetch("https://slack.com/api/chat.postMessage", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.slackToken}`,
				"Content-Type": "application/json; charset=utf-8",
			},
			body: JSON.stringify({
				channel: this.slackChannelId,
				blocks: [{ type: "markdown", text: this.scannerReport.markdown }],
			}),
		});

		if (!response.ok) {
			throw new Error(`slack: HTTP ${response.status} ${response.statusText}`);
		}

		const data = (await response.json()) as { ok: boolean; error?: string };
		if (!data.ok) {
			throw new Error(`slack: chat.postMessage failed: ${data.error}`);
		}
	}

	private writeJobSummary() {
		const summaryFile = process.env.GITHUB_STEP_SUMMARY;

		if (summaryFile) {
			fs.appendFileSync(summaryFile, this.scannerReport.markdown, "utf8");
		}
	}

	public async handleNotifications() {
		await this.scannerReport.initialize();

		if (this.isPullRequest) {
			core.info("notifications: remove previous issue comment");
			await removeIssueComment(this.pullRequestIssue, this.scannerReport.scannerComment, this.octokit);
		}

		if (this.scannerReport.hasAlertWithinThreshold) {
			core.info("notifications: write job summary");
			this.writeJobSummary();

			if (this.isPullRequest) {
				core.info("notifications: create pull request comment");
				await sendIssueComment(this.pullRequestIssue, this.scannerReport.markdown, this.octokit);
			}

			if (this.slackEnabled) {
				core.info("notifications: create slack message");
				await this.sendSlackNotification();
			}
		}
	}
}

export { type Notifications, ScannerNotifications };
