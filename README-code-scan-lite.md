# `gha-security/code-scan-lite`

A simpler version of [Code scan](README-code-scan.md) for repositories without Java, Kotlin or Scala.
It scans the code without building it, so there is nothing to configure.

For Java and Kotlin, use [Code scan lite JVM support](README-code-scan-lite-jvm-support.md).

## Usage

Add the following step to your workflow configuration:

```yml
jobs:
  code-scan:
    name: Code Scan
    uses: entur/gha-security/.github/workflows/code-scan-lite.yml@v2
```

No secrets are needed. To get Slack notifications, pass the Slack token:

```yml
jobs:
  code-scan:
    name: Code Scan
    uses: entur/gha-security/.github/workflows/code-scan-lite.yml@v2
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

> [!IMPORTANT]
> `secrets: inherit` is not supported, and the workflow fails if it is used. Pass only the secrets you need.

## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

|                                     INPUT                                     |  TYPE  | REQUIRED | DEFAULT |                                                                         DESCRIPTION                                                                          |
|-------------------------------------------------------------------------------|--------|----------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| <a name="input_ignore_language"></a>[ignore_language](#input_ignore_language) | string |  false   |         | Comma-separated list of languages for <br>CodeQL to ignore. See [CodeQL Languages](https://github.com/github/codeql-action/blob/main/src/languages.ts)  |

<!-- AUTO-DOC-INPUT:END -->

## Secrets

<!-- AUTO-DOC-SECRETS:START - Do not remove or modify this section -->

|                                                    SECRET                                                     | REQUIRED |                                                            DESCRIPTION                                                            |
|---------------------------------------------------------------------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------|
|                <a name="secret_SLACK_BOT_TOKEN"></a>[SLACK_BOT_TOKEN](#secret_SLACK_BOT_TOKEN)                |  false   | Slack bot token is used <br>for notifications. Must be passed <br>explicitly, `secrets: inherit` is not <br>supported.  |
| <a name="secret_external_repository_token"></a>[external_repository_token](#secret_external_repository_token) |  false   | Token to access the external <br>repository mentioned in the codescan.yml <br>file. Must have read access <br>to the repository.  |

<!-- AUTO-DOC-SECRETS:END -->

## Which one should I use?

| Your repository                                                         | Use                                             |
|-------------------------------------------------------------------------|-------------------------------------------------|
| TypeScript, JavaScript, Python, Go, Ruby, C#, C/C++ or only GitHub Actions | `code-scan-lite.yml`                      |
| Java or Kotlin (Maven or Gradle)                                        | [`code-scan-lite-jvm-support.yml`](README-code-scan-lite-jvm-support.md) |
| Scala, GitHub Packages, Softpay Nexus, a bigger runner or custom queries | [`code-scan.yml`](README-code-scan.md)        |

## What is different from Code scan

| Feature                                   | Code scan lite | Code scan lite JVM support | Code scan |
|-------------------------------------------|:-----------------:|:-------------:|:---------:|
| CodeQL with `security-extended` queries    | ✅                | ✅            | ✅        |
| Allowlist, PR comments and Slack           | ✅                | ✅            | ✅        |
| Entur trusted Actions publishers           | ✅                | ✅            | ✅        |
| Java and Kotlin                            | ❌                | ✅            | ✅        |
| Java setup and Artifactory credentials     | ❌                | ✅            | ✅        |
| Gradle dependency graph upload             | ❌                | ✅            | ✅        |
| Semgrep (Scala)                            | ❌                | ❌            | ✅        |
| Custom runner, queries and Gradle options  | ❌                | ❌            | ✅        |

All workflows upload results with the same CodeQL categories, so existing alerts are kept when you switch between them.

Code scan lite does not need the `packages: read` or `contents: write` permissions.

## Golden Path

- Workflow must be named `codeql.yml`.

### Example

```yaml
# codeql.yml
name: "CodeQL"

on:
    pull_request:
        branches:
            - main
    push:
        branches:
            - main
        paths-ignore:
            - '**/README.md'
    schedule:
        - cron: "0 3 * * MON"

jobs:
    code-scan:
        name: Code Scan
        uses: entur/gha-security/.github/workflows/code-scan-lite.yml@v2
```

## Allowlists, notifications and config

Code scan lite uses the same `.entur/security/codescan.yml` config as Code scan.
See [Code Scan config](README-code-scan.md#code-scan-config) and [Notifications](README-code-scan.md#notifications).

## Troubleshooting

### Error: "secrets: inherit" is not supported

Replace `secrets: inherit` with the secrets you need, see [Usage](#usage).

### Warning: Java, Kotlin or Scala files were found but are not scanned

The repository contains JVM code. Use [Code scan lite JVM support](README-code-scan-lite-jvm-support.md) instead.
