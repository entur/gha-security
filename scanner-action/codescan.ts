import * as core from "@actions/core";
import * as github from "@actions/github";
import { type Octokit, RequestError } from "octokit";
import type { AllowlistCodeScan, CweTagValues, GithubRepo, PartialCodeScanningAlert, PartialCodeScanningAlertResponse, ScannerConfig } from "./typedefs.js";

const getCodeScanningAlerts = async (octokit: Octokit) => {
	const ref = github.context.ref;
	const githubRepo = github.context.repo;
	try {
		core.info(`Fetching code scanning alerts from repo ${githubRepo.owner}/${githubRepo.repo} with ref ${ref}`);
		return await octokit.paginate(
			octokit.rest.codeScanning.listAlertsForRepo,
			{
				owner: githubRepo.owner,
				repo: githubRepo.repo,
				ref,
				per_page: 100,
				state: "open",
			},
			(response: PartialCodeScanningAlertResponse) => response.data,
		);
	} catch (error) {
		if (error instanceof RequestError) {
			if (error.status === 404) {
				core.warning(`No scanning alerts found: ${JSON.stringify(error.response?.data)}`);
				return null;
			}

			if (error.status === 403) {
				core.warning("GitHub Advanced Security is not enabled for this repository");
				return null;
			}

			throw Error(`Failed to fetch code scanning alerts: ${error.message}`);
		}

		throw Error("Failed to fetch alerts");
	}
};

const convertToCweTagMap = (localAllowlist: AllowlistCodeScan[], externalAllowlist: AllowlistCodeScan[]) => {
	const cweMap: Map<string, CweTagValues> = new Map();

	const REASON_MAPPING = new Map([
		["false_positive", "false positive"],
		["wont_fix", "won't fix"],
		["test", "used in tests"],
	]);

	for (const entry of externalAllowlist) {
		cweMap.set(`external/cwe/${entry.cwe}`, { comment: entry.comment, reason: REASON_MAPPING.get(entry.reason) as "false positive" | "won't fix" | "used in tests" });
	}

	// Set Priority
	for (const entry of localAllowlist) {
		cweMap.set(`external/cwe/${entry.cwe}`, { comment: entry.comment, reason: REASON_MAPPING.get(entry.reason) as "false positive" | "won't fix" | "used in tests" });
	}

	return cweMap;
};

const updateCodeScanningAlerts = async (codeScanAlerts: PartialCodeScanningAlert[], octokit: Octokit, cweTagMap: Map<string, CweTagValues>) => {
	const dismissedAlerts = new Set();
	const githubRepo = github.context.repo;
	for (const [cweTag, cweTagValue] of cweTagMap.entries()) {
		const matchingAlerts = codeScanAlerts.filter((alert) => alert?.rule?.tags?.includes(cweTag) && !dismissedAlerts.has(alert.number));

		for (const matchingAlert of matchingAlerts) {
			await octokit.rest.codeScanning.updateAlert({
				owner: githubRepo.owner,
				repo: githubRepo.repo,
				alert_number: matchingAlert.number,
				state: "dismissed",
				dismissed_comment: cweTagValue.comment,
				dismissed_reason: cweTagValue.reason,
			});
			dismissedAlerts.add(matchingAlert.number);
		}
	}
};

const dismissCodeScanAlerts = async (scannerConfig: ScannerConfig, octokit: Octokit, externalScannerConfig?: ScannerConfig) => {
	const localAllowlist = (scannerConfig.spec?.allowlist ?? []) as AllowlistCodeScan[];
	const externalAllowlist = (externalScannerConfig?.spec?.allowlist ?? []) as AllowlistCodeScan[];

	if (localAllowlist.length === 0 && externalAllowlist.length === 0) {
		core.info("No allowlist found");
		return;
	}

	core.info("Suppress codescan alerts");
	const codeScanAlerts = await getCodeScanningAlerts(octokit);

	if (!codeScanAlerts) return;

	const cweMap = convertToCweTagMap(localAllowlist, externalAllowlist);

	await updateCodeScanningAlerts(codeScanAlerts, octokit, cweMap);
};

export { dismissCodeScanAlerts };
