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
The reusable workflow uses the [Grype scanner](https://github.com/marketplace/actions/anchore-container-scan) to scan the Docker image for vulnerabilities. Any findings will be published to the _Security_ tab of the repository, under the _Code Scanning_ section. If you believe that a finding is a false positive or otherwise not relevant, you can either manually dimiss the alert, or create a scanner config file (YAML-file) with allowlist spec that dismisses all alerts that matches a vulnerability ID (CVE). This list is then used in the current repo, but can also be shared and used with other repos. 

This list is also used by the Artifact Registry Scanner.



*NOTE*: If the scan is performed on a pull request, remember to filter the Code Scanning results by pull request number and not the branch name.

See [Docker Scan config](#docker-scan-config) for how to setup allowlist in config.

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

## Notifications

Notifications will be sent out when there are alerts with severity equal or higher than threshold set. By default, high alerts will be notified under pull requests.

Notifications for Docker Scan supports alerts from tool(s):
- Grype

**Severity threshold:**

Severity threshold is by default set to high, all alert with severity that equals the threshold or higher will trigger notifications.
The threshold can be set to one of the following values:
- low
- medium
- high
- critical

### Outputs

**Slack:**

Slack notifications are by default disabled, and can be configured by creating a scanner config in repository or inherit a shared config.
See [Docker Scan config](#docker-scan-config) for how to configure Docker Scan config.

We use [entur/gha-slack](https://github.com/entur/gha-slack) to send out notifications.

**Note:** Slack channel used for Notifications needs to have `Github Actions bot` in the channel, see [gha-slack prereqs](https://github.com/entur/gha-slack/blob/main/.github/README.md#prereqs) on how to invite the bot.


**Pull Request:**

Pull request notifications will comment on current pull request after a scan, and are by default enabled.
To disable pull request notifications see [Docker Scan config](#docker-scan-config) section.

### Known issues
* Notifications fetches alerts before allowlist changes happen for Docker Scan.

## Docker Scan config

Requirements for Docker Scan config:
- The config file MUST adhere to the [format specified later in this document](#schema).
- The config file MUST be named either `dockerscan.yml` or `dockerscan.yaml`.
- The file MUST be placed in `.entur/security`, relative to the root of the repository.

Shared config works by referencing it in when you define a spec for your project. The contents of the spec in config is then combined with the one in your repo. The contents of the "local" config takes presedence of the "external" config.

To use an external config create a YAML file in a different repository, reference the *name* of the repository in the `.spec.inherit` field of your config file.

Read Permissions of the repo containing any external allowslists are REQUIRED. It is important to note that a fine-grained access token must be created, with READ CONTENT permissions to the repository. The token then MUST be added as a secret to the repository where the workflow is executed, and MUST be named `EXTERNAL_REPOSITORY_TOKEN`.

You can find documentation on how to create a fine-grained access token [here](https://docs.github.com/en/enterprise-cloud@latest/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token), and how to add it as a secret to your repository [here](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

Requirements for referencing **external** config
- A fine-grained access token must be created to access the external config file, with READ CONTENT permissions to the external repository.
- The token must be added as a secret to the repository where the workflow is run, and be named `EXTERNAL_REPOSITORY_TOKEN`.
- Any repository using an external config file for inheritance, must still define `inherit` under spec referencing the name of the repo containing the external config file. See [schema](#schema) for more info.

### Schema
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
  notifications:
    severityThreshold: {threshold for notifications}
    outputs:
      slack:
          enabled: {boolean for enabling slack notifications}
          channelId: {slack channel with github actions bot}
      pullRequest:
           enabled: {boolean for enabling pull request notifications}
```

**Metadata:**

The `id` field MUST be a unique alphanumeric (no special characters) string identifing the allowlist. This can be anything, but when in doubt use your app ID.

The OPTIONAL `name` field under the metadata section SHOULD be the name of the project.

The OPTIONAL `owner` field MUST be whomever's responsible for the list, like team or a single developer.

**Spec:**

The OPTIONAL `inherit` field MUST be the name of containing repository where containing a valid `spec` you wish to inherit from.

The OPTIONAL `allowlist` field MUST be a list of vulnerabilities that you want to dismiss/allow. For each vulnerability you want to dismiss, you MUST add a new item to the list. Each item is an object and MUST contain the following fields: `cwe`, `comment`, and `reason`.
- The `cve` field corresponds to the CWE-ID of the vulnerability you want to dismiss,
- The `comment` field is a comment explaining why the vulnerability is dismissed.
- The `reason` field MUST be one of the following types:
   - `false_positive` This alert is not valid
   - `wont_fix` This alert is not relevant
   - `test` This alert is not in production code

*Note:* `inherit` and items under `spec` are NOT mutually exclusive. Any items under `allowlist` and `notifications` takes precedence over an inherited spec.

The OPTIONAL `notifications` field
- The `severityThreshold` defines the threshold for when notifications are sent out.  
  The field MUST be one of the following types
   - `low`
   - `medium` 
   - `high`
   - `critical`
- The `outputs` field corresponds to notification outputs.
  - The `slack` field SHOULD include:
    - `enabled` boolean for enabling slack notifications
    - `channelId` channelId for slack channel with github actions bot
  - The `pullRequest` field SHOULD include:
    - `enabled` boolean for enabling pull request notifications

### Example

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
  notifications:
    severityThreshold: "high"
    outputs:
      slack:
        enabled: true
        channelId: "SLACK_CHANNEL_ID"
      pullRequest:
        enabled: false
```

## Github Rulesets

See [Security rulesets](README-security-rulesets.md) for how to setup code scanning merge protection ruleset.
