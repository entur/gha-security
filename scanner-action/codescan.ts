import * as github from "@actions/github";
import * as core from "@actions/core";
import { ScannerConfig, PartialCodeScanningAlert, CweTagValues, AllowlistCodeScan } from './typedefs.js'
import { combineAllowlists } from './allowlist.js'
import { Octokit } from "octokit";

const getCodeScanningAlerts = async (repository: string, octokit: Octokit) => {
    const ref = github.context.ref
    try {
        console.log(`   [5.1] Fetch code scanning alerts from repo ${repository} with ref ${ref}`)
        const alerts = await octokit.paginate(octokit.rest.codeScanning.listAlertsForRepo,
            {
                owner: "entur",
                repo: repository,
                ref,
                per_page: 100
            },
            (response: any) => response.data
        )
        return alerts
    } catch (error: any) {
        core.setFailed(`Failed to fetch alerts: ${error.message}`)
        return null
    }
}

const convertToCweTagMap = (allowlist: AllowlistCodeScan[]) => {
    const cweMap: Map<string, CweTagValues> = new Map()

    const REASON_MAPPING = new Map([
        ["false_positive", "false positive"],
        ["wont_fix", "won't fix"],
        ["test", "used in tests"]
    ])

    allowlist.forEach(entry =>
        cweMap.set(`external/cwe/${entry.cwe}`, { comment: entry.comment, reason: REASON_MAPPING.get(entry.reason) as "false positive" | "won't fix" | "used in tests" })
    )

    return cweMap
}

const updateCodeScanningAlerts = async (codeScanAlerts: PartialCodeScanningAlert[], octokit: Octokit, cweTagMap: Map<string, CweTagValues>, repository: string) => {
    let dismissedAlerts = new Set()
    for (const [cweTag, cweTagValue] of cweTagMap.entries()) {
        const matchingAlerts = codeScanAlerts.filter(alert => alert?.rule?.tags?.includes(cweTag) && !dismissedAlerts.has(alert.number))

        for (const matchingAlert of matchingAlerts) {
            await octokit.rest.codeScanning.updateAlert({
                owner: "entur",
                repo: repository,
                alert_number: matchingAlert.number,
                state: 'dismissed',
                dismissed_comment: cweTagValue.comment,
                dismissed_reason: cweTagValue.reason
            })
            dismissedAlerts.add(matchingAlert.number)
        }
    }
}

const dismissCodeScanAlerts = async (repository: string, scannerConfig: ScannerConfig, octokit: Octokit, externalScannerConfig?: ScannerConfig,) => {
    const allowlist = combineAllowlists(scannerConfig, externalScannerConfig) as AllowlistCodeScan[]

    if (allowlist.length == 0) {
        console.log("[5] No allowlist found, skipping 'Suppress codescan alerts' step")
        return
    }

    console.log("[5] Suppress codescan alerts")
    const codeScanAlerts = await getCodeScanningAlerts(repository, octokit)

    if (!codeScanAlerts)
        return

    const cweMap = convertToCweTagMap(allowlist)

    await updateCodeScanningAlerts(codeScanAlerts, octokit, cweMap, repository)
}

export { dismissCodeScanAlerts }