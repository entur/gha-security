import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "octokit";
import { dismissAlerts, getAlerts } from "./github-security.js";
import type { ScannerConfig } from "./scanner-config.js";

interface Allowlist {
	cve?: string;
	cwe?: string;
	comment: string;
	reason: "false_positive" | "wont_fix" | "test";
}

const runAllowlist = async (octokit: Octokit, tool: string, scannerConfig: ScannerConfig) => {
	if (scannerConfig.spec?.allowlist?.length === 0) {
		core.info("No allowlist found");
		return;
	}

	const repository = github.context.repo;
	const toolName = tool === "dockerscan" ? "grype" : "CodeQL";

	const alerts = await getAlerts(octokit, github.context.ref, repository, toolName);

	if (!alerts) return;

	core.info("Dismissing alerts from allowlist");
	await dismissAlerts(alerts, octokit, scannerConfig.spec?.allowlist ?? [], repository);
};

export { runAllowlist, type Allowlist };
