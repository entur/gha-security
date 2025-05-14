# Scanner Action

Scanner Action is used for dismissing vulnerabilities for DockerScan and CodeScan.

## Inputs

### `token`

**Required** GitHub Token.

### `external-repository-token`

**Required** External Repository GitHub Token.

### `scanner`

**Required** Type of scanner

## Setup

Action uses Yarn 4.9.1 and Typescript.

To build a new distribution run
```
cd scanner-action
yarn # installs packages
yarn build # runs typescript compiler
```

This will update the javascript files in `/dist` if there are no typescript errors.