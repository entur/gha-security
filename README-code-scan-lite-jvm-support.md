# `gha-security/code-scan-lite-jvm-support`

A simpler version of [Code scan](README-code-scan.md) for Java and Kotlin repositories.
Java is always set up, Gradle is detected automatically, and the Gradle dependency graph is uploaded from the default branch.
Other languages in the repository, like GitHub Actions or TypeScript, are scanned the same way as in Code scan lite, without Java setup or build secrets.

For repositories without Java or Kotlin, use [Code scan lite](README-code-scan-lite.md).

## Usage

Add the following step to your workflow configuration:

```yml
jobs:
  code-scan:
    name: Code Scan
    uses: entur/gha-security/.github/workflows/code-scan-lite-jvm-support.yml@v2
    secrets:
      ARTIFACTORY_AUTH_USER: ${{ secrets.ARTIFACTORY_AUTH_USER }}
      ARTIFACTORY_AUTH_TOKEN: ${{ secrets.ARTIFACTORY_AUTH_TOKEN }}
```

The Artifactory secrets are only needed if the build downloads dependencies from Artifactory.
Add `SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}` to get Slack notifications.

> [!IMPORTANT]
> `secrets: inherit` is not supported, and the workflow fails if it is used. Pass only the secrets you need.

## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

|                                                     INPUT                                                      |  TYPE  | REQUIRED |   DEFAULT   |                                                                       DESCRIPTION                                                                       |
|----------------------------------------------------------------------------------------------------------------|--------|----------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
|                 <a name="input_ignore_language"></a>[ignore_language](#input_ignore_language)                  | string |  false   |             | Comma-separated list of languages for <br>CodeQL to ignore. See [CodeQL Languages](https://github.com/github/codeql-action/blob/main/src/languages.ts)  |
|              <a name="input_java_distribution"></a>[java_distribution](#input_java_distribution)               | string |  false   | `"temurin"` |                                                 Java distribution for "actions/setup-java" to <br>use                                                   |
| <a name="input_java_server_id_artifactory"></a>[java_server_id_artifactory](#input_java_server_id_artifactory) | string |  false   |             |   Java server id for "actions/setup-java" <br>to use. This will setup <br>maven server with artifactory credentials <br>for CodeQL autobuild to use.    |
|                      <a name="input_java_version"></a>[java_version](#input_java_version)                      | string |  false   |   `"25"`    |                                                    Java version for "actions/setup-java" to <br>use                                                     |

<!-- AUTO-DOC-INPUT:END -->

## Secrets

<!-- AUTO-DOC-SECRETS:START - Do not remove or modify this section -->

|                                                    SECRET                                                     | REQUIRED |                                                            DESCRIPTION                                                            |
|---------------------------------------------------------------------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------|
|     <a name="secret_ARTIFACTORY_AUTH_TOKEN"></a>[ARTIFACTORY_AUTH_TOKEN](#secret_ARTIFACTORY_AUTH_TOKEN)      |  false   |          Token for the Artifactory repository. <br>Must be passed explicitly, `secrets: inherit` <br>is not supported.            |
|       <a name="secret_ARTIFACTORY_AUTH_USER"></a>[ARTIFACTORY_AUTH_USER](#secret_ARTIFACTORY_AUTH_USER)       |  false   |       The username for the Artifactory <br>repository. Must be passed explicitly, <br>`secrets: inherit` is not supported.        |
|                <a name="secret_SLACK_BOT_TOKEN"></a>[SLACK_BOT_TOKEN](#secret_SLACK_BOT_TOKEN)                |  false   |        Slack bot token is used <br>for notifications. Must be passed <br>explicitly, `secrets: inherit` is not supported.         |
| <a name="secret_external_repository_token"></a>[external_repository_token](#secret_external_repository_token) |  false   | Token to access the external <br>repository mentioned in the codescan.yml <br>file. Must have read access <br>to the repository.  |

<!-- AUTO-DOC-SECRETS:END -->

## Which one should I use?

See [Which one should I use?](README-code-scan-lite.md#which-one-should-i-use) and the feature comparison in Code scan lite.

Use [Code scan](README-code-scan.md) instead if you need Scala, GitHub Packages, Softpay Nexus, Maven cache, a bigger runner, custom queries or custom Gradle options.

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
        uses: entur/gha-security/.github/workflows/code-scan-lite-jvm-support.yml@v2
        secrets:
            ARTIFACTORY_AUTH_USER: ${{ secrets.ARTIFACTORY_AUTH_USER }}
            ARTIFACTORY_AUTH_TOKEN: ${{ secrets.ARTIFACTORY_AUTH_TOKEN }}
        with:
            java_version: 25
```

## Maven with Artifactory

Set `java_server_id_artifactory` to the server id used in your `pom.xml`, for example `entur-partner`.
See [Setup Artifactory](README-code-scan.md#setup-artifactory) for details.

## Allowlists, notifications and config

Code scan lite JVM support uses the same `.entur/security/codescan.yml` config as Code scan.
See [Code Scan config](README-code-scan.md#code-scan-config) and [Notifications](README-code-scan.md#notifications).

## Troubleshooting

### Error: "secrets: inherit" is not supported

Replace `secrets: inherit` with the secrets you need, see [Usage](#usage).

See [Code scan troubleshooting](README-code-scan.md#troubleshooting). Autobuild and Gradle issues are the same for both workflows.
