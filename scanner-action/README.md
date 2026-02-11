# Scanner Action

Scanner Action is used for dismissing vulnerabilities for DockerScan and CodeScan.

## Inputs

### `token`

**Required** GitHub Token.

### `external-repository-token`

**Required** External Repository GitHub Token.

### `scanner`

**Required** Type of scanner

## Outputs

### `notification_severity_alert_found`

Alert with specified threshold severity has been found

### `notification_severity_overview`

Overview of amount of alerts with severity found

### `notification_severity_filter`

Severity filter for fetching alerts

### `notification_severity_threshold`

Alerts with threshold matching severity triggers notifications

### `notification_slack_channel_id`

Slack channel id for notifications

### `notification_slack_enabled`

Enabled Slack notifications

### `notification_pull_request_enabled`

Enabled pull request notifications

## Setup

Action uses Yarn 4.9.1 and Typescript.

To build a new distribution run
```
cd scanner-action
yarn # installs packages
yarn build
```

This will update the javascript files in `/dist` if there are no typescript errors.

## Biome
We use Biome to format and lint the node project.

### Github Actions

Biome runs during CI to make sure it's linted and formatted correctly.

### local

After doing changes, run:
```bash
yarn check
``` 
to see if there are anything that needs to be fixed

if there are any safe fixable changes it recommends, run:
```bash
yarn check-fix
```

Unsafe fixes should be fixed manually, and check if it still builds by running:
```bash
yarn build
```
