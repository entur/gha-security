# Changelog

## [2.0.1](https://github.com/entur/gha-security/compare/v2.0.0...v2.0.1) (2024-10-16)


### Bug Fixes

* Fixed spec parser and improved debug, warning and error messages ([#47](https://github.com/entur/gha-security/issues/47)) ([a4e8eb8](https://github.com/entur/gha-security/commit/a4e8eb8f73ddd4090da85e2450c566631575e557))

## [2.0.0](https://github.com/entur/gha-security/compare/v1.1.3...v2.0.0) (2024-10-15)


### ⚠ BREAKING CHANGES

* Allowlists for [codescan](https://github.com/entur/gha-security/blob/main/README-code-scan.md#schema-for-allowlist-file) and [dockerscan](https://github.com/entur/gha-security/blob/main/README-docker-scan.md#schema-for-allowlist-file) adhere to new schema requirements.
* Allowlists MUST be located in `.entur/security`
* Allowlists have new naming requirements:
 * `codescan_config.yml`
 * `dockerscan_config.yml`

### Bug Fixes

* Access token missing in docker scan ([2e9730b](https://github.com/entur/gha-security/commit/2e9730b5e382c60db6c4a06e5bbb002c5af3d2f9))
* Added ARTIFACTORY_AUTH_USER as env variable for autobuild. ([0067c73](https://github.com/entur/gha-security/commit/0067c7351e3384fe6152658e8a34a0784c8e1e80))
* Allowlists adhere to spec ([bee629a](https://github.com/entur/gha-security/commit/bee629a8c070671ff4dbb07b724c51480b97bb87))
* Support artifactory_url from org variables ([8ad8833](https://github.com/entur/gha-security/commit/8ad883339130796c688db382861c476d16d61d9c))
* Support new artifactory token ([ae787c4](https://github.com/entur/gha-security/commit/ae787c4765deb5e1561a2b9bbae31592ae5e4197))

## [1.1.3](https://github.com/entur/gha-security/compare/v1.1.2...v1.1.3) (2024-10-15)


### Bug Fixes

* properly access token in docker scan ([948927a](https://github.com/entur/gha-security/commit/948927a27fd693c639a2a2a8283851fd82cfad10))

## [1.1.2](https://github.com/entur/gha-security/compare/v1.1.1...v1.1.2) (2024-09-30)


### Bug Fixes

* Path checking in matching-PR ([23f663a](https://github.com/entur/gha-security/commit/23f663ae28a5389648f84f68ac25546127fb4537))

## [1.1.1](https://github.com/entur/gha-security/compare/v1.1.0...v1.1.1) (2024-09-04)


### Bug Fixes

* Fixed issue with downloading artifacts from the wrong workflow run ([#36](https://github.com/entur/gha-security/issues/36)) ([12959e7](https://github.com/entur/gha-security/commit/12959e701123b510ebd455115c13d0d3a8f144a9))

## [1.1.0](https://github.com/entur/gha-security/compare/v1.0.2...v1.1.0) (2024-08-19)


### Features

* skip code scan on push ([d998c44](https://github.com/entur/gha-security/commit/d998c4436cff893a6040e98b770e9610ecf60fc5))

## [1.0.2](https://github.com/entur/gha-security/compare/v1.0.1...v1.0.2) (2024-07-10)


### Bug Fixes

* Update code-scan.yml to retrieve 100 open code scanning alerts ([0c64b3b](https://github.com/entur/gha-security/commit/0c64b3ba89ba6617b9331edcb9bad8691abacd30))

## [1.0.1](https://github.com/entur/gha-security/compare/v1.0.0...v1.0.1) (2024-07-09)


### Bug Fixes

* fix:  ([ea805d0](https://github.com/entur/gha-security/commit/ea805d07da3e94383e85669388a23112de1049fe))
* Improve Semgrep scanning configuration in code-scan.yml ([0b1ecad](https://github.com/entur/gha-security/commit/0b1ecadae8b5261a4316e5a97222d7424bc40079))
* Improve Semgrep scanning configuration in code-scan.yml ([353169e](https://github.com/entur/gha-security/commit/353169eac0fa865637e0ceecc00d628980e26a24))
* Improve Semgrep scanning configuration in code-scan.yml ([227636a](https://github.com/entur/gha-security/commit/227636aae5438ca952eb8ede8b2b5ef893f4dd15))
* Improve Semgrep scanning configuration in code-scan.yml ([86fbaa5](https://github.com/entur/gha-security/commit/86fbaa5c6946989b4f90023c1f93f9344eb7550f))
* Update code-scan.yml to improve Semgrep scanning configuration ([c2ab48e](https://github.com/entur/gha-security/commit/c2ab48ea88e62b5dc8a47fa3fa13b42a19c92333))

## [1.0.0](https://github.com/entur/gha-security/compare/v0.3.0...v1.0.0) (2024-07-08)


### ⚠ BREAKING CHANGES

* add scanning for scala

### Features

* add scanning for scala ([32ada4c](https://github.com/entur/gha-security/commit/32ada4c990fc5212cbc66f17644565f06c647fa6))


### Bug Fixes

* Add conditional check for repository languages before running codeql-analysis job ([a2caaa5](https://github.com/entur/gha-security/commit/a2caaa5769127851936a3a6196e741aac9f653a3))
* remove unnecessary conditions ([712c096](https://github.com/entur/gha-security/commit/712c096fde02af08c66fc88c070d8ca6fd5ea1fd))
