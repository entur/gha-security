import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from 'fs';
import * as yaml from 'yaml';
import { Octokit } from "octokit";
import { throttling } from "@octokit/plugin-throttling";
import { Ajv } from 'ajv'

import { ScannerConfig, PartialCodeScanningAlert, AllowlistEntry, CweTagValues  } from './typedefs'


/**
 * @param {string} config -
 * @returns {(ScannerConfig|null)}
 */
const parseScannerConfig = (config) => {
    try {
        return yaml.parse(config);
    } catch (error) {
        console.error(`[SKIP] Failed to parse yaml config - ${error}`);
        return null;
    }
}

/**
 * @param {string} token - token with access to repository content
 * @param {string} repository - repository name
 * @param {string} scanner - scanner name
 * @returns {(string|null)}
 */
const fetchExternalConfigContent = async (token, repository, scanner) => {
    const octokitClient = new Octokit({
        auth: token
    })

    const YAML_EXTENSIONS = ["yml", "yaml"]
    const yamlPaths = YAML_EXTENSIONS.map(extension => `.entur/security/${scanner}.${extension}`)

    let contentPromises = yamlPaths.map(filePath => octokitClient.rest.repos.getContent({
        owner: "Entur",
        repo: repository,
        path: filePath
    }))


    let results = await Promise.allSettled(contentPromises)

    const fulfilledResult = results.filter(result => result.status === 'fulfilled')

    if (fulfilledResult.length == 0) {
        console.log(`   [SKIP] Found no external config from ${repository}`);
        return
    }

    const contentBase64 = fulfilledResult[0].value.data.content.replaceAll("\n", "")
    const configContent = Buffer.from(contentBase64, "base64").toString("utf-8")

    if (configContent === "")
        return null

    return configContent
};

/**
 * 
 * @param {ScannerConfig} scannerConfig - configuration for the scanner
 * @param {string} scanner - name of the scanner
 * @param {string} externalToken - token to access external repository
 * @returns {(ScannerConfig|null)}
 */
const getExternalScannerConfig = async (scannerConfig, scanner, externalToken) => {
    console.log("[3] Get external scanner config");
    const externalRepository = scannerConfig.spec.inherit

    if (!externalRepository) {
        return null
    }

    console.log(`   [3.1] Fetch external config from ${repository}`);
    let content = await fetchExternalConfigContent(externalToken, externalRepository, scanner)
    if (!content) return null

    console.log(`   [3.2] Parse external config from ${externalRepository}`);
    return parseScannerConfig(content)
};

/**
 * Get scanner configuration
 * @param {string} scanner - name of scanner
 * @returns {(ScannerConfig|null)}
 */
const getScannerConfig = (scanner) => {
    console.log("[1] Get scanner config");
    const YAML_EXTENSIONS = ["yml", "yaml"]
    const filePathList = YAML_EXTENSIONS.map(extension => `.entur/security/${scanner}.${extension}`)
    console.log(`   [1.1] Get config file from ${JSON.stringify(filePathList)}`);
    const existingPathList = filePathList.filter(path => fs.existsSync(path))

    if (existingPathList.length === 0) {
        console.log("[SKIP] No file found")
        return null
    }

    console.log(`   [1.2] Read config file ${existingPathList[0]}`);
    const fileContent = fs.readFileSync(existingPathList[0], "utf8");

    console.log(`   [1.3] Parse config file ${existingPathList[0]}`);
    return parseScannerConfig(fileContent)
};

/**
 * Scanner config defined in JSON Schema
 * @param {string} scanner - scanner name
 * @returns {object}
 */
const getScannerConfigSchema = (scanner) => {
    const vulnerabilityId = scanner == "dockerscan" ? "cve" : "cwe"

    return {
        title: "ScannerConfig",
        type: "object",
        properties: {
            apiVersion: { enum: ["entur.io/securitytools/v1"] },
            kind: { enum: ["DockerScanConfig", "CodeScanConfig"] },
            metadata: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    owner: { type: "string" }
                },
                required: ["id", "name", "owner"]
            },
            spec: {
                type: ["object", "null"],
                properties: {
                    inherit: {
                        type: "string",
                        pattern: "^[\\w\.-]+$"
                    },
                    allowlist: {
                        type: ["array", "null"],
                        items: {
                            type: "object",
                            required: [vulnerabilityId, "comment", "reason"],
                            properties: {
                                [vulnerabilityId]: { type: "string" },
                                comment: { type: "string" },
                                reason: { enum: ["false_positive", "wont_fix", "test"] }
                            }
                        }
                    }
                }
            }
        },
        required: ["apiVersion", "kind", "metadata", "spec"]
    }
}

/**
 * Validates using Ajv with JSON Schema
 * @param {ScannerConfig} scannerConfig
 * @returns {boolean}
 */
const validateScannerConfig = (scannerConfig, scanner) => {
    const ajvInstance = new Ajv({
        verbose: true
    })

    const scannerConfigSchema = getScannerConfigSchema(scanner)

    const validate = ajvInstance.compile(scannerConfigSchema);
    const isValid = validate(scannerConfig)

    if (!isValid) {
        console.log(`[VALIDATE] Failed to validate ${scannerConfig.kind}`)
        console.log(JSON.stringify(validate.errors, null, 2))
        return false
    }
    return true
}

/**
 * Generates grype file to ignore vulnerabilities
 * @param {AllowlistEntry[]} allowlist
 */
const generateGrypeConfig = (allowlist) => {
    const GRYPE_CONFIG_FILE = ".grype.yaml"

    // comment and reason in allowlist is not being used at the moment.
    // it's available so we can easily put it into BigQuery.
    const vulnerabilities = new Set(allowlist.map(it => it.cve))

    const grypeIgnoreList = Array.from(vulnerabilities).map(item => {
        return { vulnerability: item }
    })

    const grypeConfig = { ignore: grypeIgnoreList }

    console.log("   [5.1] Converting grype config to YAML")
    const yamlGrype = yaml.stringify(grypeConfig)
    console.log(`   [5.2] Writing YAML config to ${GRYPE_CONFIG_FILE}`)
    fs.writeFileSync(".grype.yaml", yamlGrype)
}

/**
 * Combines local and external scanner config allowlists
 * @param {ScannerConfig} scannerConfig 
 * @param {ScannerConfig} externalScannerConfig 
 * @returns {AllowlistEntry[]}
 */
const combineAllowlists = (scannerConfig, externalScannerConfig) => {
    const localAllowlist = scannerConfig.spec?.allowlist ?? []
    const externalAllowlist = externalScannerConfig?.spec?.allowlist ?? []

    return [...localAllowlist, ...externalAllowlist]
}

/**
 * 
 * @param {ScannerConfig} scannerConfig 
 * @param {ScannerConfig} externalScannerConfig 
 */
const dimissDockerScanAlerts = (scannerConfig, externalScannerConfig) => {
    const allowlist = combineAllowlists(scannerConfig, externalScannerConfig)

    if (allowlist.length > 0) {
        console.log("[5] Suppress Grype alerts")
        generateGrypeConfig(allowlist)
        return
    }

    console.log("[5] No allowlist found, skipping 'Suppress Grype alerts'")
    return
}

/**
 * 
 * @param {string} repository 
 * @param {Octokit} octokit 
 * @returns {Promise<(PartialCodeScanningAlert[]|null)>}
 */
const getCodeScanningAlerts = async (repository, octokit) => {
    const ref = true ? "" : github.context.ref

    try {
        console.log(`   [5.1] Fetch code scanning alerts from repo ${repository} with ref ${ref}`)
        const alerts = await octokit.paginate(octokit.rest.codeScanning.listAlertsForRepo,
            {
                owner: "entur",
                repo: repository,
                ref,
                per_page: '100'
            },
            (response) => response.data
        )
        return alerts
    } catch (error) {
        console.error("[ERROR] Failed to fetch alerts from Github")
        console.error(error)
        //core.setFailed(`Failed to fetch alerts: ${error.message}`)
        return null
    }
}

/**
 * Maps allowlist to format for supressing code scanning alerts
 * @param {AllowlistEntry[]} allowlist
 * @returns {Map<string, CweTagValues>}
 */
const convertToCweTagMap = (allowlist) => {
    const cweMap = new Map()

    const REASON_MAPPING = new Map([
        ["false_positive", "false positive"],
        ["wont_fix", "won't fix"],
        ["test", "used in tests"]
    ])

    allowlist.forEach(entry =>
        cweMap.set(`external/cwe/${entry.cwe}`, { comment: entry.comment, reason: REASON_MAPPING.get(entry.reason) })
    )

    return cweMap
}

/**
 * 
 * @param {PartialCodeScanningAlert[]} codeScanAlerts 
 * @param {Octokit} octokit
 * @param {Map<string, CweTagValues>} cweTagMap 
 */
const updateCodeScanningAlerts = async (codeScanAlerts, octokit, cweTagMap) => {
    for (const [cweTag, cweTagValue] of cweTagMap.entries()) {
        const matchingAlerts = codeScanAlerts.filter(alert => alert.rule.tags.includes(cweTag))

        for (const matchingAlert of matchingAlerts) {
            await octokit.rest.codeScanning.updateAlert({
                alert_number: matchingAlert.number,
                state: 'dismissed',
                dismissed_comment: cweTagValue.comment,
                dismissed_reason: cweTagValue.reason
            })
        }
    }
}

/**
 * 
 * @param {string} repository 
 * @param {ScannerConfig} scannerConfig 
 * @param {ScannerConfig} externalScannerConfig 
 * @param {Octokit} octokit 
 * @returns 
 */
const dismissCodeScanAlerts = async (repository, scannerConfig, externalScannerConfig, octokit) => {
    const allowlist = combineAllowlists(scannerConfig, externalScannerConfig)

    if (allowlist.length == 0) {
        console.log("[5] No allowlist found, skipping 'Suppress codescan alerts' step")
        return
    }

    console.log("[5] Suppress codescan alerts")
    const codeScanAlerts = await getCodeScanningAlerts(repository, octokit)

    if (!codeScanAlerts)
        return

    const cweMap = convertToCweTagMap(allowlist)

    await updateCodeScanningAlerts(codeScanAlerts, octokit, cweMap)
}

/**
 * Shared throttle configuration used for Octokit
 */
const getOctokitTrottleConfig = () => {
    return {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
            octokit.log.warn(
                `Request quota exhausted for request ${options.method} ${options.url}`,
            );

            if (retryCount < 1) {
                // only retries once
                octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                return true;
            }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
            // does not retry, only logs a warning
            octokit.log.warn(
                `SecondaryRateLimit detected for request ${options.method} ${options.url}`,
            );
        },
    }
}

const main = async () => {
    try {
        const TOKEN = "NOT_HERE"
        const EXTERNAL_TOKEN = "NOT_HERE"
        const VALID_SCANNERS = ["dockerscan", "codescan"]
        const SCANNER = "dockerscan"
        const REPOSITORY = "test"
        const ThrottledOctokit = Octokit.plugin(throttling);

        const octokitExternal = new ThrottledOctokit({
            auth: TOKEN,
            throttle: getOctokitTrottleConfig()
        })

        const octokitAction = new ThrottledOctokit({
            auth: EXTERNAL_TOKEN,
            throttle: getOctokitTrottleConfig()
        })

        //const TOKEN = core.getInput("token")
        //const REPOSITORY = github.context.repo
        //const SCANNER = core.getInput("scanner")
        //const EXTERNAL_TOKEN = core.getInput("external-token")

        if (!VALID_SCANNERS.includes(SCANNER)) {
            core.setFailed(`Invalid scanner defined ${SCANNER}`);
            return
        }

        const scannerConfig = getScannerConfig(SCANNER);

        if (!scannerConfig) {
            console.log(`[SKIP] failed to get yaml config for ${SCANNER}`);
            return
        }

        console.log("[2] Validate scanner config");
        if (!validateScannerConfig(scannerConfig, SCANNER)) {
            core.setFailed(`Failed to validate ${SCANNER} config`);
            return
        }

        let externalScannerConfig = await getExternalScannerConfig(scannerConfig, SCANNER, octokitExternal)

        if (!externalScannerConfig) {
            console.log(`[4] No external config found, skipping 'Validate external ${SCANNER} config'`)
        } else {
            console.log(`[4] Validate external ${SCANNER} config`)
            if (!validateScannerConfig(externalScannerConfig, SCANNER)) {
                core.setFailed(`Failed to validate external ${SCANNER} config`);
                return
            }
        }

        switch (SCANNER) {
            case "dockerscan":
                dimissDockerScanAlerts(scannerConfig, externalScannerConfig)
                break;

            case "codescan":
                dismissCodeScanAlerts(REPOSITORY, scannerConfig, externalScannerConfig, octokitAction)
                break

            default:
                break;
        }

    } catch (error) {
        console.log(error)
        core.setFailed(error.message);
    }
}

main()