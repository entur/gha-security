import * as fs from 'fs';
import * as yaml from 'yaml';
import { ScannerConfig } from './typedefs.js'
import { Octokit } from "octokit";
import { Ajv } from 'ajv'



const parseScannerConfig = (config: string) => {
    try {
        return yaml.parse(config);
    } catch (error) {
        console.error(`[SKIP] Failed to parse yaml config - ${error}`);
        return;
    }
}

const fetchExternalConfigContent = async (octokit: Octokit, repository: string, scanner: string) => {

    const YAML_EXTENSIONS = ["yml", "yaml"]
    const yamlPaths = YAML_EXTENSIONS.map(extension => `.entur/security/${scanner}.${extension}`)

    let contentPromises = yamlPaths.map(filePath => octokit.rest.repos.getContent({
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
    const response = fulfilledResult[0].value

    if ("content" in response.data) {
        const contentBase64 = response.data.content.replaceAll("\n", "")
        const configContent = Buffer.from(contentBase64, "base64").toString("utf-8")
        return configContent
    }

    return
};

const getExternalScannerConfig = async (scannerConfig: ScannerConfig, scanner: string, octokit: Octokit | undefined) => {
    if (octokit == undefined) {
        console.log("[3] No external repository token found, skipping 'Get external scanner config'")
        return
    }

    console.log("[3] Get external scanner config");
    const externalRepository = scannerConfig.spec?.inherit

    if (!externalRepository) {
        return
    }

    console.log(`   [3.1] Fetch external config from ${externalRepository}`);
    let content = await fetchExternalConfigContent(octokit, externalRepository, scanner)
    if (!content) return

    console.log(`   [3.2] Parse external config from ${externalRepository}`);
    return parseScannerConfig(content)
};


const getScannerConfig = (scanner: string) => {
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

const getScannerConfigSchema = (scanner: string) => {
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
                required: ["id"]
            },
            spec: {
                type: ["object", "null"],
                required: ["allowlist"],
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


const validateScannerConfig = (scannerConfig: ScannerConfig, scanner: string) => {
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

export { getExternalScannerConfig, getScannerConfig, validateScannerConfig }

