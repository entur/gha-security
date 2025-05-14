import * as github from "@actions/github";
import * as core from "@actions/core";
import { ScannerConfig, PartialCodeScanningAlert, AllowlistEntry, CweTagValues } from './typedefs'
import { combineAllowlists } from './allowlist'
import { Octokit } from "octokit";


/**
 * 
 * @param {string} repository 
 * @param {Octokit} octokit 
 * @returns {Promise<(PartialCodeScanningAlert[]|null)>}
 */
const getCodeScanningAlerts = async (repository, octokit) => {
    try {
        console.log(`   [5.1] Fetch code scanning alerts from repo ${repository} with ref ${ref}`)
        const alerts = await octokit.paginate(octokit.rest.codeScanning.listAlertsForRepo,
            {
                owner: "entur",
                repo: repository,
                ref: github.context.ref,
                per_page: '100'
            },
            (response) => response.data
        )
        return alerts
    } catch (error) {
        core.setFailed(`Failed to fetch alerts: ${error.message}`)
        return null
    }
}

/**
 * Maps allowlist to format for supressing code scanning alerts
 * @param {AllowlistEntry[]} allowlist
 * @returns {Map<string, CweTagValues>}
 */
const convertToCweTagMap = (allowlist) => {
    const cweMap = new Map()

    const REASON_MAPPING = new Map([
        ["false_positive", "false positive"],
        ["wont_fix", "won't fix"],
        ["test", "used in tests"]
    ])

    allowlist.forEach(entry =>
        cweMap.set(`external/cwe/${entry.cwe}`, { comment: entry.comment, reason: REASON_MAPPING.get(entry.reason) })
    )

    return cweMap
}

/**
 * 
 * @param {PartialCodeScanningAlert[]} codeScanAlerts 
 * @param {Octokit} octokit
 * @param {Map<string, CweTagValues>} cweTagMap 
 */
const updateCodeScanningAlerts = async (codeScanAlerts, octokit, cweTagMap) => {
    for (const [cweTag, cweTagValue] of cweTagMap.entries()) {
        const matchingAlerts = codeScanAlerts.filter(alert => alert.rule.tags.includes(cweTag))

        for (const matchingAlert of matchingAlerts) {
            await octokit.rest.codeScanning.updateAlert({
                alert_number: matchingAlert.number,
                state: 'dismissed',
                dismissed_comment: cweTagValue.comment,
                dismissed_reason: cweTagValue.reason
            })
        }
    }
}

/**
 * 
 * @param {string} repository 
 * @param {ScannerConfig} scannerConfig 
 * @param {ScannerConfig} externalScannerConfig 
 * @param {Octokit} octokit 
 * @returns 
 */
const dismissCodeScanAlerts = async (repository, scannerConfig, externalScannerConfig, octokit) => {
    const allowlist = combineAllowlists(scannerConfig, externalScannerConfig)

    if (allowlist.length == 0) {
        console.log("[5] No allowlist found, skipping 'Suppress codescan alerts' step")
        return
    }

    console.log("[5] Suppress codescan alerts")
    const codeScanAlerts = await getCodeScanningAlerts(repository, octokit)

    if (!codeScanAlerts)
        return

    const cweMap = convertToCweTagMap(allowlist)

    await updateCodeScanningAlerts(codeScanAlerts, octokit, cweMap)
}

export { dismissCodeScanAlerts }