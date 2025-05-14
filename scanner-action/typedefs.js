/* JSDoc type definitions */
/** 
 * @typedef ScannerMetadata
 * @property {string} id - unique identifier
 * @property {string} name - human redable name
 * @property {string} owner - responsible team or developer
 */

/** 
 * @typedef AllowlistEntry
 * @property {(string|null)} cve - cve-id
 * @property {(string|null)} cwe - cwe-id
 * @property {string} comment - comment explaining why the vulnerability is dismissed
 * @property {("false_positive"|"wont_fix"|"test")} reason - reason for dismissing the vulnerability
 */

/**
 * @typedef ScannerSpec
 * @property {(string | null)} inherit - name of repository where the external scanner config file is placed
 * @property {(AllowlistEntry[] | null)} allowlist - list over CVE's to dismiss
 */

/**
 * @typedef ScannerConfig
 * @property {string} apiVersion - api version
 * @property {string} kind - type of scanner configuration
 * @property {(ScannerMetadata|null)} metadata - metadata
 * @property {(ScannerSpec|null)} spec - spec
 */

/**
 * @typedef PartialCodeScanningAlertRule
 * @property {string[]} tags
 */

/**
 * @typedef PartialCodeScanningAlert
 * @property {number} number
 * @property {PartialCodeScanningAlertRule} rule
 */

/**
 * @typedef CweTagValues
 * @property {string} comment
 * @property {("false positive"|"won't fix"|"used in tests")} reason
 */

export {};