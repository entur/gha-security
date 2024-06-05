# `gha-security/docker-scan`

## Usage

Add the following step to your workflow configuration:

```yml
jobs:
  docker-scan:
    name: Docker Scan
    uses: entur/gha-security/.github/workflows/docker-scan.yml@main
    with:
        image_artifact: # The name of the image artifact to scan
    
```

## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

|                                           INPUT                                           |  TYPE  | REQUIRED |    DEFAULT     |                 DESCRIPTION                  |
|-------------------------------------------------------------------------------------------|--------|----------|----------------|----------------------------------------------|
| <a name="input_image_artifact"></a>[image_artifact](#input_image_artifact)                | string |  true    |                |  The name of the image artifact to scan      |
| <a name="input_image_whitelist"></a>[image_whitelist](#input_image_whitelist) | string |  false   | `"image_whitelist.yaml"` | The path to the file <br>containing the whitelisting rules, starting <br>from the root of the <br>repository  |

<!-- AUTO-DOC-INPUT:END -->

## Golden Path

- Docker image must be built before being scanned, preferably using reusable workflow `entur/gha-docker/.github/workflows/build.yml@main`.

### Example

Let's look at an example, assume our repo is called `amazing-app`:

```sh
λ amazing-app ❯ tree
.
├── README.md
├── Dockerfile
└── .github
    └── workflows
        └── ci.yml
```

```yaml
# ci.yml
name: CI

on:
  pull_request:

jobs:
  docker-lint:
    uses: entur/gha-docker/.github/workflows/lint.yml@v1

  docker-build:
    uses: entur/gha-docker/.github/workflows/build.yml@v1

  docker-image-scan:
    needs: docker-build
    uses: entur/gha-security/.github/workflows/docker-scan.yml@v0.2.0
    with:
        image_artifact: ${{ needs.docker-build.outputs.image_artifact }}

  docker-push:
    needs: docker-scan
    uses: entur/gha-docker/.github/workflows/push.yml@v1
    secrets: inherit
```


### White-listing vulnerabilities
The reusable workflow uses the [Grype scanner](https://github.com/marketplace/actions/anchore-container-scan) to scan the Docker image for vulnerabilities. The scanner will fail if any critical vulnerabilities are found. If you believe that a found vulnerability is a false positive or otherwise not relevant, you can create a whitelist file (YAML-file) that dismisses all alerts that matches a vulnerability ID.

The whitelist file should be placed in the root of the repository, and the path to the file should be provided as an input to the workflow. The file must have the following format:

```yaml
Image whitelisting:
- cve: {cve-id}
  comment: {comment explaining why the vulnerability is dismissed}
  reason: {reason for dismissing the vulnerability}
```

The `cve` field should be the CVE-ID of the vulnerability you want to dismiss, the `comment` field should be a comment explaining why the vulnerability is dismissed, and the `reason` field should be a short description on why the vulnerability is dismissed.

### Example

```yaml
Image whitelisting:
- cve: "CVE-2021-1234"
  comment: "This alert is a false positive"
  reason: "false_positive"
```
