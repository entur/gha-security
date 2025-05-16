
interface AllowlistBase {
    comment: string,
    reason: "false_positive" | "wont_fix" | "test"
}

interface AllowlistDockerScan extends AllowlistBase {
    cve: string
}

interface AllowlistCodeScan extends AllowlistBase {
    cwe: string
}

interface ScannerSpec {
    inherit?: string,
    allowlist?: AllowlistCodeScan[] | AllowlistDockerScan[]
}

interface ScannerMetadata {
    id: string,
    name: string,
    owner: string
}

interface ScannerConfig {
    apiVersion: string,
    kind: string,
    metadata?: ScannerMetadata,
    spec?: ScannerSpec
}

interface PartialCodeScanningAlertRule {
    tags?: string[] | null
}

interface PartialCodeScanningAlert {
    "number": number
    rule: PartialCodeScanningAlertRule
}

interface CweTagValues {
    comment: string;
    reason: "false positive" | "won't fix" | "used in tests"
}


export { CweTagValues, PartialCodeScanningAlert, ScannerConfig, AllowlistDockerScan, AllowlistCodeScan };

