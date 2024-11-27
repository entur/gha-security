# `gha-security/docker-scan`

## Usage

Add the following step to your workflow configuration:

```yml
jobs:
  docker-scan:
    name: Docker Scan
    uses: entur/gha-security/.github/workflows/docker-scan.yml@v2
    with:
        image_artifact: # The name of the image artifact to scan
    
```
or add the Entur Shared Workflow _Docker Build and Push_. This will build, push and scan the Docker image.
Go to the _Actions_ tab in your repository, click on _New workflow_ and select the button _Configure_ on the _Docker Build and Push_ workflow.


## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

|                                   INPUT                                    |  TYPE  | REQUIRED | DEFAULT |      DESCRIPTION       |
|----------------------------------------------------------------------------|--------|----------|---------|------------------------|
| <a name="input_image_artifact"></a>[image_artifact](#input_image_artifact) | string |   true   |         | Image artifact to scan |

<!-- AUTO-DOC-INPUT:END -->

## Golden Path

- Docker image must be built before being scanned, preferably using reusable workflow `entur/gha-docker/.github/workflows/build.yml@v2`.

### Example

Let's look at an example, assume our repository is called `amazing-app`:

```sh
λ amazing-app ❯ tree
.
├── README.md
├── Dockerfile
└── .github
    └── workflows
        └── docker-build-push.yml
```

```yaml
# docker-build-push.yml
name: Docker Build and Push

on:
  pull_request:
    branches:
      - "main"
    ignore-paths:
      - '**\README.md'

jobs:
  docker-lint:
    name: Docker Lint
    uses: entur/gha-docker/.github/workflows/lint.yml@v1
    with:
      dockerfile: Dockerfile
  docker-build:
    name: Build Docker Image
    needs: docker-lint
    uses: entur/gha-docker/.github/workflows/build.yml@v1
    with:
      dockerfile: Dockerfile
  docker-push:
    name: Push Docker Image
    needs: docker-build
    uses: entur/gha-docker/.github/workflows/push.yml@v1
  docker-scan:
    name: Scan Docker Image
    needs: docker-build
    uses: entur/gha-security/.github/workflows/docker-scan.yml@v2
    with:
      image_artifact: ${{ needs.docker-build.outputs.image_artifact }}
      
```


## Allowlisting vulnerabilities
The reusable workflow uses the [Grype scanner](https://github.com/marketplace/actions/anchore-container-scan) to scan the Docker image for vulnerabilities. Any findings will be published to the _Security_ tab of the repository, under the _Code Scanning_ section. If you believe that a finding is a false positive or otherwise not relevant, you can either manually dimiss the alert, or create a allowlist file (YAML-file) that dismisses all alerts that matches a vulnerability ID (CVE). This list is then used in the current repo, but can also be shared and used with other repos. 

This list is also used by the Artifact Registry Scanner.

Requirements:
- The allowlist file MUST adhere to the [format specified later in this document](#schema-for-allowlist-file).
- The allowlist file MUST be named either `dockerscan.yml` or `dockerscan.yaml`.
- The file MUST be placed in `.entur/security`, relative to the root of the repository.

*NOTE*: If the scan is performed on a pull request, remember to filter the Code Scanning results by pull request number and not the branch name.

Shared allowlists works by referencing it in when you define an allowlist for your project. The contents of that list is then combined with the one in your repo. The contents of the "local" allowlist takes presedence of the "external" list. 

To use an external allowlist create a YAML file in a different repository, reference the *name* of the repository in the `.spec.inherit` field of your allowlist.

Read Permissions of the repo containing any external allowslists are REQUIRED. It is important to note that a fine-grained access token must be created, with READ CONTENT permissions to the repository. The token then MUST be added as a secret to the repository where the workflow is executed, and MUST be named `EXTERNAL_REPOSITORY_TOKEN`. 

You can find documentation on how to create a fine-grained access token [here](https://docs.github.com/en/enterprise-cloud@latest/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token), and how to add it as a secret to your repository [here](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository). See the example below on how to use a repository secret, named `EXTERNAL_REPOSITORY_TOKEN`, in the workflow.

```yaml
jobs:
  docker-scan:
    needs: docker-build
    uses: entur/gha-security/.github/workflows/docker-scan.yml@v2
    with:
        image_artifact: ${{ needs.docker-build.outputs.image_artifact }}
    secrets:
        external_repository_token: ${{ secrets.EXTERNAL_REPOSITORY_TOKEN }}
```

### Schema for allowlist file
```yaml
apiVersion: entur.io/securitytools/v1
kind: DockerScanConfig
metadata:
  id: {unique identifier}
  name: {human readable name}
  owner: {responsible team or developer}
spec:
  inherit: {repository where the external allowlist file is placed}
  allowlist:
  - cve: {cve-id}
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
 - The `cve` field corresponds to the CWE-ID of the vulnerability you want to dismiss, 
 - The `comment` field is a comment explaining why the vulnerability is dismissed.
 - The `reason` field MUST be one of the following types:
    - `false_positive` This alert is not valid
    - `wont_fix` This alert is not relevant
    - `test` This alert is not in production code

*Note:* `inherit` and `allowlist` are NOT mutually exclusive. Any items in `allowlist` takes presedence over an inherited allowlist.

#### Example

```yaml
apiVersion: entur.io/securitytools/v1
kind: DockerScanConfig
metadata:
  id: myprojectconfig
  name: my-project-config
  owner: team-supreme
spec:
  allowlist:
  - cve: "CVE-2021-1234-abc"
    comment: "This alert is a false positive"
    reason: "false_positive"
```
## Github Rulesets

See [Security rulesets](README-security-rulesets.md) for how to setup code scanning merge protection ruleset.