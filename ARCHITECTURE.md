# Architecture

This document describes how the reusable workflows in `gha-security` fit together.
For a non-technical overview, see the [README](README.md). For usage and inputs, see
[Code scan](README-code-scan.md) and [Docker scan](README-docker-scan.md).

## Overview

Both workflows upload their findings as SARIF to GitHub Code Scanning, then run the
[scanner-action](scanner-action/README.md), which dismisses allowlisted alerts from
`.entur/security/*.yml` and notifies about remaining alerts at or above the severity threshold.

## Code scan

Build secrets passed through `additional_build_secrets` are only exported while CodeQL autobuild
and the Gradle dependency graph run, and are cleared afterwards.

```mermaid
flowchart TB
    CALLER["Repository workflow<br/>uses: code-scan.yml@v2"] --> DETECT["Detect repository languages<br/>and Gradle build"]

    DETECT --> SCAN
    DETECT --> DEPGRAPH["Upload Gradle dependency graph<br/>(default branch only)"]

    subgraph SCAN["Static analysis"]
        CODEQL["CodeQL<br/>security-extended queries<br/>+ Entur trusted-publishers model pack"]
        SEMGREP["Semgrep<br/>languages not supported by CodeQL (Scala)"]
    end

    SCAN -- SARIF --> GHCS[("GitHub Code Scanning")]
    GHCS --> SCANNER

    subgraph SCANNER["scanner-action (scanner: codescan)"]
        LOAD["Load and validate<br/>.entur/security/codescan.yml<br/>+ inherited config"] --> ALLOW["Dismiss allowlisted alerts<br/>matched by CWE"]
        ALLOW --> NOTIFY["Count open alerts<br/>≥ severityThreshold (default: high)"]
    end

    SCANNER --> OUTPUTS
    SCANNER -- remaining open alerts --> RULESET{{"Branch ruleset<br/>blocks merge on Critical alerts"}}

    subgraph OUTPUTS["Notifications"]
        PR["Pull request comment"]
        SUMMARY["Job summary"]
        SLACK["Slack notification<br/>(if enabled)"]
    end
```

## Docker scan

```mermaid
flowchart TB
    CALLER["Repository workflow<br/>builds image and uploads it as artifact<br/>uses: docker-scan.yml@v2"] --> DOWNLOAD["Download image artifact<br/>(optionally extract Docker workdir)"]

    DOWNLOAD --> SYFT["Syft<br/>generate SBOM (SPDX)"]
    SYFT --> GRYPE["Grype<br/>scan SBOM for known CVEs"]
    SYFT --> SBOM_OUT

    subgraph SBOM_OUT["SBOM outputs"]
        ARTIFACT["Workflow artifact<br/>(image).spdx.json"]
        DEPGRAPH["GitHub dependency graph<br/>(default branch only)"]
    end

    GRYPE -- SARIF --> GHCS[("GitHub Code Scanning")]
    GHCS --> SCANNER

    subgraph SCANNER["scanner-action (scanner: dockerscan)"]
        LOAD["Load and validate<br/>.entur/security/dockerscan.yml<br/>+ inherited config<br/>+ central allowlist (currently disabled)"] --> ALLOW["Dismiss allowlisted alerts<br/>matched by CVE"]
        ALLOW --> NOTIFY["Count open alerts<br/>≥ severityThreshold (default: high)"]
    end

    SCANNER --> OUTPUTS
    SCANNER -- remaining open alerts --> RULESET{{"Branch ruleset<br/>blocks merge on Critical alerts"}}

    subgraph OUTPUTS["Notifications"]
        PR["Pull request comment"]
        SUMMARY["Job summary"]
        SLACK["Slack notification<br/>(if enabled)"]
    end
```
