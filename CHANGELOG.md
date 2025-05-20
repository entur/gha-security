# Changelog

## [2.3.3](https://github.com/entur/gha-security/compare/v2.3.2...v2.3.3) (2025-05-20)


### Bug Fixes

* Update docker-scan critical alerts pull request comment check ([#93](https://github.com/entur/gha-security/issues/93)) ([64178c1](https://github.com/entur/gha-security/commit/64178c12379b458e7b976ce4a5e8e30ad4f3b12d))

## [2.3.2](https://github.com/entur/gha-security/compare/v2.3.1...v2.3.2) (2025-05-14)


### Bug Fixes

* Re-enable step with nullglob shell option ([#90](https://github.com/entur/gha-security/issues/90)) ([6940f2f](https://github.com/entur/gha-security/commit/6940f2fff77f4f4a4c5937888fbfeadc45dd1ccf))

## [2.3.1](https://github.com/entur/gha-security/compare/v2.3.0...v2.3.1) (2025-05-14)


### Bug Fixes

* Disable upload step to debug globbing ([#88](https://github.com/entur/gha-security/issues/88)) ([7df5cde](https://github.com/entur/gha-security/commit/7df5cdef6ca2606aa698835dab44a2058d55b0ee))

## [2.3.0](https://github.com/entur/gha-security/compare/v2.2.1...v2.3.0) (2025-05-14)


### Features

* Add Syft to docker scan ([e8a0d23](https://github.com/entur/gha-security/commit/e8a0d23ec1bd3a2e42643ff1b745c748250c97ff))
* automatic use-setup-gradle and SBOM generation ([#82](https://github.com/entur/gha-security/issues/82)) ([b065919](https://github.com/entur/gha-security/commit/b06591943b64a1744871678fb82249ec84c8ec01))
* Exclude workdir from Syft to prevent duplicate detections in GitHub ([e8a0d23](https://github.com/entur/gha-security/commit/e8a0d23ec1bd3a2e42643ff1b745c748250c97ff))
* Have Grype consume Syft spdx ([e8a0d23](https://github.com/entur/gha-security/commit/e8a0d23ec1bd3a2e42643ff1b745c748250c97ff))
* Simplify steps by converting some python code to equivalent bash ([b065919](https://github.com/entur/gha-security/commit/b06591943b64a1744871678fb82249ec84c8ec01))
* Submit dependency graph to Github on merge/push to default branch ([b065919](https://github.com/entur/gha-security/commit/b06591943b64a1744871678fb82249ec84c8ec01))

## [2.2.1](https://github.com/entur/gha-security/compare/v2.2.0...v2.2.1) (2025-02-07)


### Bug Fixes

* wrong quotes used in inline script ([#79](https://github.com/entur/gha-security/issues/79)) ([a28f866](https://github.com/entur/gha-security/commit/a28f866229f55c62a9501c735a2b92ba7bb77fb5))

## [2.2.0](https://github.com/entur/gha-security/compare/v2.1.0...v2.2.0) (2025-02-07)


### Features

* Added an environment variable IS_CODEQL_SCAN ([d10a2ed](https://github.com/entur/gha-security/commit/d10a2ed84cb72c7207ddf877270bab243db5ce48))
* Added customizable job runner option ([d10a2ed](https://github.com/entur/gha-security/commit/d10a2ed84cb72c7207ddf877270bab243db5ce48))
* Added gradle build options ([d10a2ed](https://github.com/entur/gha-security/commit/d10a2ed84cb72c7207ddf877270bab243db5ce48))

## [2.1.0](https://github.com/entur/gha-security/compare/v2.0.11...v2.1.0) (2025-01-16)


### Features

* set security-extended as default for code-ql ([#71](https://github.com/entur/gha-security/issues/71)) ([8003834](https://github.com/entur/gha-security/commit/80038348b2377282698ff33d7764cb11a0ee590d))

## [2.0.11](https://github.com/entur/gha-security/compare/v2.0.10...v2.0.11) (2025-01-13)


### Bug Fixes

* add better error message to docker-scan and code-scan workflows ([#69](https://github.com/entur/gha-security/issues/69)) ([f80e51b](https://github.com/entur/gha-security/commit/f80e51b3381b7d1c1d855445574dcb290854ac22))

## [2.0.10](https://github.com/entur/gha-security/compare/v2.0.9...v2.0.10) (2025-01-07)


### Bug Fixes

* update code-scan workflow to also check for Semgrep OSS alerts ([#66](https://github.com/entur/gha-security/issues/66)) ([18d69fa](https://github.com/entur/gha-security/commit/18d69fa2ca6bfc8ee9ae25adc989415b8bc8fb7f))

## [2.0.9](https://github.com/entur/gha-security/compare/v2.0.8...v2.0.9) (2025-01-03)


### Bug Fixes

* update pr comment format and print to job summary on schedule event for code & docker scan. ([#64](https://github.com/entur/gha-security/issues/64)) ([5e26acc](https://github.com/entur/gha-security/commit/5e26acc0012dfa84f5a65ca48e3f6e06942e8186))

## [2.0.8](https://github.com/entur/gha-security/compare/v2.0.7...v2.0.8) (2025-01-02)


### Bug Fixes

* update grype from commit to v6 major release ([#62](https://github.com/entur/gha-security/issues/62)) ([aab0ea4](https://github.com/entur/gha-security/commit/aab0ea48528cb9359afcba074c222b7cab29d075))

## [2.0.7](https://github.com/entur/gha-security/compare/v2.0.6...v2.0.7) (2024-12-09)


### Bug Fixes

* update to use ubuntu-24.04 runner ([#60](https://github.com/entur/gha-security/issues/60)) ([7706824](https://github.com/entur/gha-security/commit/770682408f36d8fa6b5fc08a1a6034439e28b137))

## [2.0.6](https://github.com/entur/gha-security/compare/v2.0.5...v2.0.6) (2024-12-06)


### Bug Fixes

* upgrade gradle_opts to use 4gb ([#58](https://github.com/entur/gha-security/issues/58)) ([7f60710](https://github.com/entur/gha-security/commit/7f6071002236efd57dbcef2c3d92734db645906d))

## [2.0.5](https://github.com/entur/gha-security/compare/v2.0.4...v2.0.5) (2024-11-07)


### Bug Fixes

* Language detection & errors on dependabot pushes ([#54](https://github.com/entur/gha-security/issues/54)) ([1302531](https://github.com/entur/gha-security/commit/1302531ec06c935773157741b5e62a0a7840d182))

## [2.0.4](https://github.com/entur/gha-security/compare/v2.0.3...v2.0.4) (2024-11-05)


### Bug Fixes

* os.geten error in docker-scan ([b0af179](https://github.com/entur/gha-security/commit/b0af1790b40e8ebf6e3784db1a260d378078b54c))

## [2.0.3](https://github.com/entur/gha-security/compare/v2.0.2...v2.0.3) (2024-11-04)


### Bug Fixes

* Lots of minor bugs in gha-security ([#51](https://github.com/entur/gha-security/issues/51)) ([8d7508d](https://github.com/entur/gha-security/commit/8d7508d41e60225d541bb51585b3e4a798a407dc))

## [2.0.2](https://github.com/entur/gha-security/compare/v2.0.1...v2.0.2) (2024-11-01)


### Bug Fixes

* Made it possible to have nullable spec and allowlists. Also enforced allowed reason types ([#49](https://github.com/entur/gha-security/issues/49)) ([7d0a912](https://github.com/entur/gha-security/commit/7d0a91289b9c7231af3bbd681dac2d5c4c4212d9))

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
