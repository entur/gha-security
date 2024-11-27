# `gha-security/code-scan`

## Usage

Add the following step to your workflow configuration:

```yml
jobs:
  code-scan:
    name: Code Scan
    uses: entur/gha-security/.github/workflows/code-scan.yml@v2
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
        paths-ignore:
            - '**/README.md'
    schedule:
        - cron: "0 3 * * MON"
  
jobs:
    code-scan:
        name: Code Scan
        uses: entur/gha-security/.github/workflows/code-scan.yml@v2
        secrets: inherit
```

## Optional Dependency caching for Java/Kotlin

Code vulnerability scans of Java and Kotlin are done by running autobuild, which runs any identified build systems, like Gradle.

If the project uses the [gradle/actions/setup-gradle](https://github.com/gradle/actions/?tab=readme-ov-file#the-setup-gradle-action) action, you can set code scanning to utilize any available cache from the 'main' branch. This potentially speeds up code analysis jobs.


**Caching is deactivated by default.**

To activate caching, set input `use_setup_gradle` to `true`.

Example:

```yaml
# codeql.yml
name: "CodeQL"

...

jobs:
    code-scan:
        name: Code Scan
        uses: entur/gha-security/.github/workflows/code-scan.yml@v2
        secrets: inherit
        with:
          use_setup_gradle: true
```     

## Allow lists
The reusable workflow uses [CodeQL](https://codeql.github.com/) to scan the codebase for vulnerabilities. Any discovered vulnerabilities will be published in the _Security_ tab for the repository, under the _Code Scanning_ section. If you believe a finding is a false positive or otherwise not relevant, you can either manually dimiss the alert, or create a allowlist file (YAML-file) that dismisses all alerts that matches a vulnerability ID. This list is then used in the current repo, but can also be shared and used with other repos. 

Requirements:
- The allowlist file MUST adhere to the [format specified later in this document](#schema-for-allowlist-file).
- The allowlist file MUST be named either `codescan.yml` or `codescan.yaml`.
- The file MUST be placed in `.entur/security`, relative to the root of the repository.

*Note*: If the scan is performed on a pull request, remember to filter the Code Scanning results by pull request number and not the branch name.

Shared allowlists works by referencing it in when you define an allowlist for your project. The contents of that list is then combined with the one in your repo. The contents of the "local" allowlist takes presedence of the "external" list. 

To use an external allowlist create a YAML file in a different repository, reference the *name* of the repository in the `.spec.inherit` field of your allowlist.

Read Permissions of the repo containing any external allowslists are REQUIRED. It is important to note that a fine-grained access token must be created, with READ CONTENT permissions to the repository. The token then MUST be added as a secret to the repository where the workflow is executed, and MUST be named `EXTERNAL_REPOSITORY_TOKEN`. 

You can find documentation on how to create a fine-grained access token [here](https://docs.github.com/en/enterprise-cloud@latest/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token), and how to add it as a secret to your repository [here](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository). 

Requirements for referencing **external** allowlists
- A fine-grained access token must be created to access the external allowlist file, with READ CONTENT permissions to the external repository.
- The token must be added as a secret to the repository where the workflow is run, and be named `EXTERNAL_REPOSITORY_TOKEN`.
- Any repository using an external allowlist file for inheritance, must still define an allowlist referencing the name of the repo containing the external list. See schema for more info.

### Schema for allowlist file
```yaml
apiVersion: entur.io/securitytools/v1
kind: CodeScanConfig
metadata:
  id: {unique identifier}
  name: {human readable name}
  owner: {responsible team or developer}
spec:
  inherit: {repository where the external allowlist file is placed}
  allowlist:
  - cwe: {cwe-id}
    comment: {comment explaining why the vulnerability is dismissed}
    reason: {reason for dismissing the vulnerability}
```

**Metadata:**

All fields in `metadata` are REQUIRED.

The `id` field MUST be a unique alphanumeric (no special characters) string identifing the allowlist. This can be anything, but when in doubt use your app ID.

The `name` field under the metadata section SHOULD be the name of the project.

The `owner` field MUST be whomever's responsible for the list, like team or a single developer.

**Spec:**

The OPTIONAL `inherit` field MUST be the name of containing repository where containing a valid allow list you wish to inherit from. Only used when using an external allowlist.

The OPTIONAL `allowlist` field MUST be a list of vulnerabilities that you want to dismiss/allow. For each vulnerability you want to dismiss, you MUST add a new item to the list. Each item is an object and MUST contain the following fields: `cwe`, `comment`, and `reason`.
 - The `cwe` field corresponds to the CWE-ID of the vulnerability you want to dismiss, 
 - The `comment` field is a comment explaining why the vulnerability is dismissed.
 - The `reason` field MUST be one of the following types:
    - `false_positive` This alert is not valid
    - `wont_fix` This alert is not relevant
    - `test` This alert is not in production code

*Note:* `inherit` and `allowlist` are NOT mutually exclusive. Any items in `allowlist` takes presedence over an inherited allowlist.

#### Example

```yaml
apiVersion: entur.io/securitytools/v1
kind: CodeScanConfig
metadata:
  id: myprojectconfig
  name: my-project-config
  owner: team-supreme
spec:
  inherit: other-repo-name
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

Some potential pitfalls and solutions with CodeQL

### Autobuild fails for Gradle projects because of JVM version mismatch

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

### Autobuild fails for Gradle projects with multiple gradle project files.

Autobuild checks the root project file for which JVM version to set based on the version set on the JVM toolchain.
Github also has a page that explains it in more detail: [Autodetection for java](https://docs.github.com/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/codeql-code-scanning-for-compiled-languages#autodetection-for-java)

Autodetect will not find the correct version from child project files, if you have a root project file that does not compile JVM code. To fix this, you can trick autobuild with a comment.

The comment needs to be set on first line of the root project file (build.gradle)
```
// Hint for the CodeQL autobuilder: sourceCompatibility = <JVM_VERSION>
...
```

More detail about this fix in the [Github Issues thread](https://github.com/github/codeql-action/issues/1855#issuecomment-2161052577)

## Github Rulesets

See [Security rulesets](README-security-rulesets.md) for how to setup code scanning merge protection ruleset.