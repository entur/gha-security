const combineAllowlists = (scannerConfig, externalScannerConfig) => {
    const localAllowlist = scannerConfig.spec?.allowlist ?? [];
    const externalAllowlist = externalScannerConfig?.spec?.allowlist ?? [];
    return [...localAllowlist, ...externalAllowlist];
};
export { combineAllowlists };
