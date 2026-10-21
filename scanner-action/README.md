# Scanner Action

Scanner Action is used for dismissing vulnerabilities for DockerScan and CodeScan.

## Inputs

### `gh_token`

**Required** GitHub Token.

### `slack_bot_token`

**Required** Slack Bot Token.

### `external_repository_token`

**Required** External Repository GitHub Token.

### `scanner`

**Required** Type of scanner

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
