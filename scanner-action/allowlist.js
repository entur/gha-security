
import { ScannerConfig, AllowlistEntry  } from './typedefs'

/**
 * Combines local and external scanner config allowlists
 * @param {ScannerConfig} scannerConfig 
 * @param {ScannerConfig} externalScannerConfig 
 * @returns {AllowlistEntry[]}
 */
const combineAllowlists = (scannerConfig, externalScannerConfig) => {
    const localAllowlist = scannerConfig.spec?.allowlist ?? []
    const externalAllowlist = externalScannerConfig?.spec?.allowlist ?? []

    return [...localAllowlist, ...externalAllowlist]
}

export { combineAllowlists }