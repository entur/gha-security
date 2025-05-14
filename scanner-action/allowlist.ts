
import { ScannerConfig } from './typedefs.js'


const combineAllowlists = (scannerConfig: ScannerConfig, externalScannerConfig?: ScannerConfig) => {
    const localAllowlist = scannerConfig.spec?.allowlist ?? []
    const externalAllowlist = externalScannerConfig?.spec?.allowlist ?? []

    return [...localAllowlist, ...externalAllowlist]
}

export { combineAllowlists }