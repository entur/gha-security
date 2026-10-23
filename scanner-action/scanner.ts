interface Scanner {
	name: string;
	tool: string;
	prettyName: string;
}
const VALID_SCANNERS = ["dockerscan", "codescan"] as const;
type ScanType = (typeof VALID_SCANNERS)[number];

function isScanType(value: string): value is ScanType {
	return VALID_SCANNERS.includes(value as ScanType);
}

const SCANNER_DETAILS: Record<ScanType, Omit<Scanner, "name">> = {
	dockerscan: { tool: "grype", prettyName: "Docker Scan" },
	codescan: { tool: "codeql", prettyName: "Code Scan" },
};

const scannerFromType = (type: ScanType): Scanner => ({
	name: type,
	...SCANNER_DETAILS[type],
});

export { isScanType, type Scanner, type ScanType, scannerFromType };
