<h1 align="center">
      <img src="./images/logo.png" width="96px" height="96px" />
      <br>entur/gha-security<br>
</h1>

[![CI](https://github.com/entur/gha-security/actions/workflows/ci.yml/badge.svg)](https://github.com/entur/gha-security/actions/workflows/ci.yml)

GitHub Actions for working with security tools.

- [Code scan](README-code-scan.md)
- [Docker scan](README-docker-scan.md)

Github rulesets
- [Security rulesets](README-security-rulesets.md)

For maintainers/contributors
- [Architecture](ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)

## What it does

`gha-security` lets any Entur repository add security scanning with a single workflow step.
It scans the code and container images, lets teams mark accepted findings in their own
repository, and alerts the team about anything serious that remains.

### Code scan

```mermaid
flowchart LR
    CODE["Source code"] --> SCAN["Scan for<br/>security weaknesses"]
    SCAN --> ALLOW["Dismiss findings the team<br/>has accepted"]
    ALLOW --> ALERT["Alert the team about<br/>serious findings"]
    ALERT --> GATE["Block merging while<br/>critical findings are open<br/>(optional ruleset)"]
```

### Docker scan

```mermaid
flowchart LR
    IMAGE["Container image"] --> SBOM["List everything<br/>inside the image (SBOM)"]
    SBOM --> SCAN["Check for known<br/>vulnerabilities"]
    SBOM --> TRACK["Track dependencies<br/>over time"]
    SCAN --> ALLOW["Dismiss findings the team<br/>has accepted"]
    ALLOW --> ALERT["Alert the team about<br/>serious findings"]
    ALERT --> GATE["Block merging while<br/>critical findings are open<br/>(optional ruleset)"]
```

For how this is built, see [Architecture](ARCHITECTURE.md).
