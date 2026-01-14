import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "octokit";
import { dismissAlerts, getAlerts } from "./github-security.js";
import type { AllowlistCodeScan, AllowlistDockerScan, AllowlistEntry, ScannerConfig } from "./typedefs.js";

const REASON_MAPPING = new Map([
	["false_positive", "false positive"],
	["wont_fix", "won't fix"],
	["test", "used in tests"],
]);

const toAllowlistEntry = (allowlist: AllowlistCodeScan | AllowlistDockerScan) => {
	let rule_id = undefined;
	let rule_tag = undefined;
	const reason = REASON_MAPPING.get(allowlist.reason) as "false positive" | "won't fix" | "used in tests";
	const comment = allowlist.comment;

	if ("cve" in allowlist) {
		rule_id = allowlist.cve;
	}

	if ("cwe" in allowlist) {
		rule_tag = `external/cwe/${allowlist.cwe}`;
	}

	return {
		rule_tag,
		rule_id,
		comment,
		reason,
	} as AllowlistEntry;
};

const toAllowlistEntires = (allowlist: AllowlistCodeScan[] | AllowlistDockerScan[]) => {
	const entries: AllowlistEntry[] = [];

	for (const entry of allowlist) {
		const allowlist = toAllowlistEntry(entry);

		if (allowlist) entries.push(allowlist);
	}

	return entries;
};

const runAllowlist = async (octokit: Octokit, tool: string, scannerConfig?: ScannerConfig, externalScannerConfig?: ScannerConfig, centralScannerConfig?: ScannerConfig) => {
	const localAllowlist = scannerConfig?.spec?.allowlist ?? [];
	const externalAllowlist = externalScannerConfig?.spec?.allowlist ?? [];
	const centralAllowlist = centralScannerConfig?.spec?.allowlist ?? [];

	const allowlistEntries: AllowlistEntry[] = [];

	allowlistEntries.push(...toAllowlistEntires(localAllowlist));
	allowlistEntries.push(...toAllowlistEntires(externalAllowlist));

	if (tool === "dockerscan") {
		allowlistEntries.push(...toAllowlistEntires(centralAllowlist));
	}

	if (allowlistEntries.length === 0) {
		core.info("No allowlist found");
		return;
	}

	const repository = github.context.repo;
	const alertTool = tool === "dockerscan" ? "grype" : "CodeQL";

	core.info("Suppress codescan alerts");
	const alerts = await getAlerts(octokit, github.context.ref, repository, alertTool);

	if (!alerts) return;

	await dismissAlerts(alerts, octokit, allowlistEntries, repository);
};

export { runAllowlist };
