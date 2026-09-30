# Architecture

This document describes how the reusable workflows in `gha-security` fit together.
For a non-technical overview, see the [README](README.md). For usage and inputs, see
[Code scan](README-code-scan.md) and [Docker scan](README-docker-scan.md).

## Overview

Both workflows upload their findings as SARIF to GitHub Code Scanning, then run the
[scanner-action](scanner-action/README.md), which dismisses allowlisted alerts from
`.entur/security/*.yml` and notifies about remaining alerts at or above the severity threshold.

## Code scan

```mermaid
---
config:
  layout: elk
---
flowchart TB
    CALLER["Repository workflow<br/>uses: code-scan.yml@v2"] --> DETECT["Detect repository languages<br/>and Gradle build"]

    DETECT --> CODEQL["CodeQL<br/>security-extended queries<br/>+ Entur trusted-publishers model pack"]
    DETECT --> SEMGREP["Semgrep<br/>languages not supported by CodeQL (Scala)"]
    SECRETS["Build secrets<br/>exported for autobuild, cleared afterwards"] -.-> CODEQL
    SECRETS -.-> SEMGREP

    CODEQL -- SARIF --> GHCS[("GitHub Code Scanning")]
    SEMGREP -- SARIF --> GHCS

    CODEQL --> SCANNER
    SEMGREP --> SCANNER
    DETECT --> DEPGRAPH["Upload Gradle dependency graph<br/>(default branch only)"]

    subgraph SCANNER["scanner-action (scanner: codescan)"]
        direction TB
        LOAD["Load and validate<br/>.entur/security/codescan.yml<br/>+ inherited config"] --> ALLOW["Dismiss allowlisted alerts<br/>matched by CWE"]
        ALLOW --> NOTIFY["Count open alerts<br/>≥ severityThreshold (default: high)"]
    end

    ALLOW <-. "read / dismiss CodeQL alerts" .-> GHCS
    NOTIFY --> PR["Pull request comment"]
    NOTIFY --> SUMMARY["Job summary"]
    NOTIFY --> SLACK["Slack notification<br/>(if enabled)"]

    GHCS --> RULESET{{"Branch ruleset<br/>blocks merge on Critical alerts"}}
```

## Docker scan

```mermaid
---
config:
  layout: elk
---
flowchart TB
    CALLER["Repository workflow<br/>builds image and uploads it as artifact<br/>uses: docker-scan.yml@v2"] --> DOWNLOAD["Download image artifact<br/>(optionally extract Docker workdir)"]

    DOWNLOAD --> SYFT["Syft<br/>generate SBOM (SPDX)"]
    SYFT --> GRYPE["Grype<br/>scan SBOM for known CVEs"]
    SYFT --> ARTIFACT["Workflow artifact<br/>(image).spdx.json"]
    SYFT -- "dependency snapshot<br/>(default branch only)" --> DEPGRAPH["GitHub dependency graph<br/>(Dependabot alerts)"]
    GRYPE -- SARIF --> GHCS[("GitHub Code Scanning")]
    GRYPE --> SCANNER

    subgraph SCANNER["scanner-action (scanner: dockerscan)"]
        direction TB
        LOAD["Load and validate<br/>.entur/security/dockerscan.yml<br/>+ inherited config<br/>+ central allowlist (currently disabled)"] --> ALLOW["Dismiss allowlisted alerts<br/>matched by CVE"]
        ALLOW --> NOTIFY["Count open alerts<br/>≥ severityThreshold (default: high)"]
    end

    ALLOW <-. "read / dismiss Grype alerts" .-> GHCS
    NOTIFY --> PR["Pull request comment"]
    NOTIFY --> SUMMARY["Job summary"]
    NOTIFY --> SLACK["Slack notification<br/>(if enabled)"]

    GHCS --> RULESET{{"Branch ruleset<br/>blocks merge on Critical alerts"}}
```
