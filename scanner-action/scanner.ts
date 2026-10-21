interface Scanner {
	name: string;
	tool: string;
	prettyName: string;
}

const ScannerFromType = (type: "dockerscan" | "codescan") => {
	return {
		name: type,
		tool: type === "dockerscan" ? "grype" : "codeql",
		prettyName: type === "dockerscan" ? "Docker Scan" : "Code Scan",
	};
};

export { type Scanner, ScannerFromType };
