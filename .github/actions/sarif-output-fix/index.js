module.exports = ({ core }) => {

    const fs = require('fs');

    const sbomFilePath = process.env.SBOM_FILE;
    const sarifFilePath = process.env.SARIF_FILE;

    if (!fs.existsSync(sbomFilePath)) {
        core.warning(`sbom file not found, skipping fix`)
        return;
    }

    if (!fs.existsSync(sarifFilePath)) {
        core.warning(`sarif file not found, skipping fix`)
        return;
    }

    const readJSONFile = (filePath) => {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            core.warning(`Failed to parse file ${filePath} with error: ${error}`)
            return null;
        }
    }

    const sbomJSON = readJSONFile(sbomFilePath, 'utf8');
    const sarifJSON = readJSONFile(sarifFilePath, 'utf8');

    if (!sbomJSON || !sarifJSON)
        return;

    const getSarifRules = (sarif) => {
        try {
            return sarif["runs"][0]["tool"]["driver"]["rules"];
        } catch (error) {
            core.warning(`error while getting rules from sarif: ${error}`)
            return null;
        }
    }

    const getSarifResults = (sarif) => {
        try {
            return sarif["runs"][0]["results"];
        } catch (error) {
            core.warning(`error while getting results from sarif: ${error}`)
            return null;
        }
    }

    const getSbomPackages = (sbom) => {
        try {
            return sbom["packages"];
        } catch (error) {
            core.warning(`error while getting packages from sbom: ${error}`)
            return null;
        }
    }

    const getSbomRelationships = (sbom) => {
        try {
            return sbom["relationships"]
        } catch (error) {
            core.warning(`error while getting relationships from sbom: ${error}`)
            return null;
        }
    }

    const rules = getSarifRules(sarifJSON);

    if (!rules)
        return;

    const results = getSarifResults(sarifJSON);

    if (!results)
        return;

    const packages = getSbomPackages(sbomJSON);

    if (!packages)
        return;

    const sbomRelationships = getSbomRelationships(sbomJSON);

    if (!sbomRelationships)
        return;

    const PackageByReferenceLocator = (packages) => {
        try {
            const output = {};

            for (const sbomPackage of packages) {
                var packageUrlRef = sbomPackage["externalRefs"].find(ref => ref["referenceType"] == "purl")["referenceLocator"];

                if (packageUrlRef != "")
                    output[packageUrlRef] = sbomPackage;
            }

            return output;
        } catch (error) {
            core.warning(`error while getting packageUrlRef from sbom packages: ${error}`)
            return null;
        }
    }

    const getSbomPackageLocations = (relationships) => {
        try {
            const sbomFileRefRelationships = relationships.filter(it => it["relatedSpdxElement"].startsWith("SPDXRef-File-"))

            const sbomPackageLocations = {}

            for (const relationship of sbomFileRefRelationships) {
                const fileElementSplit = relationship["relatedSpdxElement"].split("SPDXRef-File-")[1].split("-");
                sbomPackageLocations[relationship["spdxElementId"]] = fileElementSplit.splice(0, fileElementSplit.length - 1).join("-");
            }

            return sbomPackageLocations;
        } catch (error) {
            core.warning(`error while getting sbomPackageLocations from sbom relationships: ${error}`)
            return null;
        }

    }

    const sbomPackageLocations = getSbomPackageLocations(sbomRelationships);

    if (!sbomPackageLocations)
        return;

    const sbomPackageDict = PackageByReferenceLocator(packages);

    if (!sbomPackageDict)
        return;


    const getHelpTextWithLocation = (rule, location) => {
        return rule["help"]["text"].replace("\nLocation: ", `\nLocation: ${location}`);
    }

    const getHelpMarkdownWithLocation = (rule, location) => {
        const markdown = rule["help"]["markdown"];
        const markdownTableSplit = markdown.split("|")
        const preLocationTable = markdownTableSplit.slice(0, markdownTableSplit.length - 4).join("|") + "|";
        const postLocationTable = "|" + markdownTableSplit.splice(markdownTableSplit.length - 3, markdownTableSplit.length).join("|");
        return `${preLocationTable} ${location} ${postLocationTable}`
    }

    const getResultMessageTextWithLocation = (result, location) => {
        try {
            return result["message"]["text"].replace("at: ", `at: ${location}`);
        } catch (error) {
            return null;
        }
    }

    const getLocationsByRuleId = (packageDict, locations) => {
        try {
            const locationByRuleId = {}
            for (const rule of rules) {
                let packageUrl = rule["properties"]["purls"];

                const location = locations[packageDict[packageUrl].SPDXID];
                locationByRuleId[rule["id"]] = location;
            }
            return locationByRuleId;
        }
        catch (error) {
            core.warning(`error while getting locations by ruleId: ${error}`)
            return null;
        }
    }


    const locationByRuleId = getLocationsByRuleId(sbomPackageDict, sbomPackageLocations);

    for (const rule of rules) {
        try {
            const location = locationByRuleId[rule["id"]];

            const helpTextWithLocation = getHelpTextWithLocation(rule, location);
            if (!helpTextWithLocation)
                throw new Error("Failed to get new help text with location");

            const helpMarkdownWithLocation = getHelpMarkdownWithLocation(rule, location);
            if (!helpMarkdownWithLocation)
                throw new Error("Failed to get new help markdown with location");

            rule["help"]["text"] = helpTextWithLocation;
            rule["help"]["markdown"] = helpMarkdownWithLocation;
        } catch (error) {
            core.warning(`error while updating sarif rule help text/markdown to include location: ${error}`)
            return;
        }
    }

    for (const result of results) {
        try {
            const location = locationByRuleId[result["ruleId"]];
            result["message"]["text"] = getResultMessageTextWithLocation(result, location);
        } catch (error) {
            core.warning(`error while updating sarif results text to include location ${error}`)
            return;
        }
    }

    fs.writeFileSync(sarifFilePath, JSON.stringify(sarifJSON));
};