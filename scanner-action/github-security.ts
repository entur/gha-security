import * as core from "@actions/core";
import { type Octokit, RequestError } from "octokit";
import type { Allowlist } from "./allowlist.js";
import type { GithubRepo, PartialCodeScanningAlert, PartialCodeScanningAlertResponse } from "./typedefs.js";

const handleAlertError = (error: unknown) => {
	if (!(error instanceof RequestError)) {
		throw Error("Failed to fetch alerts");
	}

	if (error.status === 404) {
		core.warning(`No scanning alerts found: ${JSON.stringify(error.response?.data)}`);
		return null;
	}

	if (error.status === 403) {
		core.warning("GitHub Advanced Security is not enabled for this repository");
		return null;
	}

	throw Error(`Failed to fetch code scanning alerts: ${error.message}`);
};

const getAlerts = async (octokit: Octokit, ref: string, repository: GithubRepo, tool: string) => {
	try {
		core.info(`Fetching ${tool} alerts from repo ${repository.owner}/${repository.repo} with ref ${ref}`);
		return await octokit.paginate(
			octokit.rest.codeScanning.listAlertsForRepo,
			{
				owner: repository.owner,
				repo: repository.repo,
				ref,
				per_page: 100,
				state: "open",
				tool_name: tool,
			},
			(response: PartialCodeScanningAlertResponse) => response.data,
		);
	} catch (error) {
		return handleAlertError(error);
	}
};

const dismissAlerts = async (alerts: PartialCodeScanningAlert[], octokit: Octokit, allowlistEntries: Allowlist[], repository: GithubRepo) => {
	const dismissedAlerts = new Set();

	const REASON_MAPPING = new Map([
		["false_positive", "false positive"],
		["wont_fix", "won't fix"],
		["test", "used in tests"],
	]);

	for (const allowlistEntry of allowlistEntries) {
		const matchingAlerts = alerts.filter((alert) => {
			if (allowlistEntry.cve) {
				// Grype scans have CVE-XXXX-XXXXXX-package as rule_id
				return alert?.rule?.id?.startsWith(allowlistEntry.cve) && !dismissedAlerts.has(alert.number);
			}

			if (allowlistEntry.cwe) {
				return alert?.rule?.tags?.includes(`external/cwe/${allowlistEntry.cwe}`) && !dismissedAlerts.has(alert.number);
			}
		});

		for (const matchingAlert of matchingAlerts) {
			await octokit.rest.codeScanning.updateAlert({
				owner: repository.owner,
				repo: repository.repo,
				alert_number: matchingAlert.number,
				state: "dismissed",
				dismissed_comment: allowlistEntry.comment,
				dismissed_reason: REASON_MAPPING.get(allowlistEntry.reason) as "false positive" | "won't fix" | "used in tests",
			});
			dismissedAlerts.add(matchingAlert.number);
		}
	}
};

export { getAlerts, dismissAlerts };
