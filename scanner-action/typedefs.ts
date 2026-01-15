import type { Allowlist } from "./allowlist.js";

interface Notification {
	enabled?: boolean;
}

interface SlackNotification extends Notification {
	channelId?: string;
}

interface PullRequestNotification extends Notification {}

interface NotificationOutputs {
	pullRequest?: PullRequestNotification;
	slack?: SlackNotification;
}

interface Notifications {
	severityThreshold: "low" | "medium" | "high" | "critical";
	outputs?: NotificationOutputs;
}

interface ScannerSpec {
	inherit?: string;
	centralAllowlist?: boolean;
	allowlist?: Allowlist[];
	notifications?: Notifications;
}

interface ScannerMetadata {
	id: string;
	name?: string;
	owner?: string;
}

interface ScannerConfig {
	apiVersion: string;
	kind: string;
	metadata?: ScannerMetadata;
	spec?: ScannerSpec;
}

type SeverityLevel = "low" | "medium" | "high" | "critical";

interface PartialCodeScanningAlertRule {
	id?: string | null;
	tags?: string[] | null;
	security_severity_level?: SeverityLevel | null | undefined;
}

interface PartialCodeScanningAlertResponse {
	data: PartialCodeScanningAlert[];
}

interface PartialCodeScanningAlert {
	number: number;
	rule: PartialCodeScanningAlertRule;
}

interface CweTagValues {
	comment: string;
	reason: "false positive" | "won't fix" | "used in tests";
}

interface GithubRepo {
	owner: string;
	repo: string;
}

export type { CweTagValues, PartialCodeScanningAlert, ScannerConfig, Allowlist, PartialCodeScanningAlertResponse, SeverityLevel, GithubRepo, Notifications, NotificationOutputs };
