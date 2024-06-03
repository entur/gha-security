# `gha-security/code_scanning`

## Usage

Add the following step to your workflow configuration:

```yml
jobs:
  code-scanning:
    name: Code Scanning
    uses: entur/gha-security/.github/workflows/code_scanning.yml@v0.1.0
```

## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

|                                           INPUT                                           |  TYPE  | REQUIRED | DEFAULT |                   DESCRIPTION                   |
|-------------------------------------------------------------------------------------------|--------|----------|---------|-------------------------------------------------|
| <a name="input_code_whitelist_file"></a>[code_whitelist_file](#input_code_whitelist_file) | string |  false   |         | Whitelisting file for code scanning <br>alerts  |

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
            - master
    push:
        branches:
            - main
            - master
  
jobs:
    code-scanning:
        name: Code Scanning
        uses: entur/gha-security/.github/workflows/code_scanning.yml@main
```

### White-listing vulnerabilities
The reusable workflow uses [CodeQL](https://codeql.github.com/) to scan the codebase for vulnerabilities. The scanner will fail if any critical vulnerabilities are found. If you believe that a found vulnerability is a false positive or otherwise not relevant, you can either manually dimiss the alert, or create a whitelist file (YAML-file) that dismisses all alerts that matches a vulnerability ID.

The whitelist file should be placed in the root of the repository, and the path to the file should be provided as an input to the workflow. The file must have the following format:

```yaml
Code whitelisting:
- cwe: external/cwe/{cwe-id}
  comment: {comment explaining why the vulnerability is dismissed}
  reason: "false_positive" / "wont_fix" / "test" 
```

The `cwe` field should be the CWE-ID of the vulnerability you want to dismiss, the `comment` field should be a comment explaining why the vulnerability is dismissed, and the `reason` field should be one of the following:
- "false_positive"
- "wont_fix"
- "test"



### Example

```yaml
Code whitelisting:
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