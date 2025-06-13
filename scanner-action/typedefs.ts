interface AllowlistBase {
	comment: string;
	reason: "false_positive" | "wont_fix" | "test";
}

interface AllowlistDockerScan extends AllowlistBase {
	cve: string;
}

interface AllowlistCodeScan extends AllowlistBase {
	cwe: string;
}

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
	allowlist?: AllowlistCodeScan[] | AllowlistDockerScan[];
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

export type {
	CweTagValues,
	PartialCodeScanningAlert,
	ScannerConfig,
	AllowlistDockerScan,
	AllowlistCodeScan,
	PartialCodeScanningAlertResponse,
	SeverityLevel,
	GithubRepo,
	Notifications,
};
