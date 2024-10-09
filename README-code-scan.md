# `gha-security/code-scan`

## Usage

Add the following step to your workflow configuration:

```yml
jobs:
  code-scan:
    name: Code Scan
    uses: entur/gha-security/.github/workflows/code-scan.yml@v1
    secrets: inherit
```
or add the Entur Shared Workflow _CodeQL Scan_. Go to the _Actions_ tab in your repository, click on _New workflow_ and select the button _Configure_ on the _CodeQL Scan_ workflow.


## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

|                                      INPUT                                       |  TYPE   | REQUIRED | DEFAULT |                                                                            DESCRIPTION                                                                             |
|----------------------------------------------------------------------------------|---------|----------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| <a name="input_use_setup_gradle"></a>[use_setup_gradle](#input_use_setup_gradle) | boolean |  false   | `false` | Use "gradle/action/setup-gradle" before running autobuild <br>(Java/Kotlin only). Potentially speeds up build <br>times if cache from main <br>branch is utilized  |

<!-- AUTO-DOC-INPUT:END -->

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
    schedule:
        - cron: "0 3 * * MON"
  
jobs:
    code-scan:
        name: Code Scan
        uses: entur/gha-security/.github/workflows/code-scan.yml@v1
        secrets: inherit
```

## Optional Dependency caching for Java/Kotlin

Code vulnerability scans of Java and Kotlin are done by running autobuild, which runs any identified build systems, like Gradle.

If the project uses the [gradle/actions/setup-gradle](https://github.com/gradle/actions/?tab=readme-ov-file#the-setup-gradle-action) action, you can set code scanning to utilize any available cache from the 'main' branch. This potentially speeds up code analysis jobs.


**Caching is deactivated by default.**

To activate caching, set input `use-setup-gradle` to `true`.

Example:

```yaml
# codeql.yml
name: "CodeQL"

...

jobs:
    code-scan:
        name: Code Scan
        uses: entur/gha-security/.github/workflows/code-scan.yml@v1
        secrets: inherit
        with:
          use_setup_gradle: true
```     

## Allowlisting vulnerabilities
The reusable workflow uses [CodeQL](https://codeql.github.com/) to scan the codebase for vulnerabilities. Any discovered vulnerabilities will be published to the _Security_ tab of the repository, under the _Code Scanning_ section. If you believe that a found vulnerability is a false positive or otherwise not relevant, you can either manually dimiss the alert, or create a allowlist file (YAML-file) that dismisses all alerts that matches a vulnerability ID. 

_NB! If the scan is performed on a pull request, remember to filter the Code Scanning results by pull request number and not the branch name._

There are two types of allowlist files that can be used; a local allowlist (placed in the repository) and an external allowlist (placed in a different repository). The local allowlist is prioritized over the external allowlist.

### Local allowlisting
To use a local allowlist, create a YAML file in the repository named, either `code_scan_config.yml` or `code_scan_config.yaml`, and place it in the root of the repository. If you create both files, the `code_scan_config.yaml` file will be ignored. The file must follow the format [mentioned below](#schema-for-allowlist-file).

Requirements:
- The allowlist file must be named either `code_scan_config.yml` or `code_scan_config.yaml` (`code_scan_config.yml` is prioritized).
- The file must be placed in the root of the repository.

### External allowlisting
To use an external allowlist create a YAML file in a different repository and place it in the root of the repository. The file must be named either `code_scan_config.yml` or `code_scan_config.yaml`, and follow the format [mentioned below](#schema-for-allowlist-file). If you create both files, the `code_scan_config.yaml` file will be ignored. To be able to use the external allowlist, you must also have a local allowlist file in the repository. The repository where the external allowlist file is placed must be referenced in the local allowlist file, under the 'inherit' field. It is important to note that a fine-grained access token must be created to access the external allowlist file, with READ CONTENT permissions to the repository. The token must then be added as a secret to the repository where the workflow is run, and be named `EXTERNAL_REPOSITORY_TOKEN`. You can find documentation on how to create a fine-grained access token [here](https://docs.github.com/en/enterprise-cloud@latest/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token), and how to add it as a secret to your repository [here](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository). 

Requirements:
- The allowlist file must be named either `code_scan_config.yml` or `code_scan_config.yaml` (`code_scan_config.yml` is prioritized).
- The file must be placed in the root of the repository.
- The repository where the external allowlist file is placed must be referenced in the local allowlist file, under the 'inherit' field.
- A fine-grained access token must be created to access the external allowlist file, with READ CONTENT permissions to the repository.
- The token must be added as a secret to the repository where the workflow is run, and be named `EXTERNAL_REPOSITORY_TOKEN`.


### Schema for allowlist file
```yaml
apiVersion: entur.io/v1alpha1 
kind: CodeScanConfig
metadata:
  name: {project-name-config}
spec:
  inherit: {repository where the external allowlist file is placed}
  allowlist:
  - cwe: {cwe-id}
    comment: {comment explaining why the vulnerability is dismissed}
    reason: {reason for dismissing the vulnerability}
```
The `name` field under the metadata section should be the name of the project. The `inherit` field under the spec section should be the repository where the external allowlist file is placed (optinal field, only used when using an external allowlist file). The `allowlist` field should be a list of vulnerabilities that you want to dismiss. For each vulnerability you want to dismiss, you should add a new item to the list. For each item in the list, you should add the following fields: `cwe`, `comment`, and `reason`. The `cwe` field should be the CWE-ID of the vulnerability you want to dismiss, the `comment` field should be a comment explaining why the vulnerability is dismissed, and the `reason` field should be one of the following:
- `false_positive`
- `wont_fix`
- `test`

#### Example

```yaml
apiVersion: entur.io/v1alpha1
kind: CodeScanConfig
metadata:
  name: my-project-config
spec:
  allowlist:
  - cwe: "cwe-080"
    comment: "This alert is a false positive"
    reason: "false_positive"
  - cwe: "cwe-916"
    comment: "Wont be able to fix this in the near future"
    reason: "wont_fix"
  - cwe: "cwe-400"
    comment: "Used for testing purposes"
    reason: "test"  
```

## Troubleshooting

These are potential pitfalls and solutions with CodeQL

### Autobuild fails for Gradle projects because of JVM versions

This can happen if Autobuild detects the wrong version of the JVM to run Gradle with. This can be solved by statically setting the JVM version in the Gradle toolchain:

```
...
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(<JVM_VERSION>)) // Replace with correct JVM Version
  }
}
...
```