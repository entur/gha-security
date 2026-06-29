module.exports = ({ core }) => {
    const fs = require('fs');
    const sarifJSON = JSON.parse(fs.readFileSync(process.env.SARIF_FILE, 'utf8'));
    const assertLocationSet = process.env.LOCATION_SET == "true";

    const fail = (message) => core.setFailed(message);
    const warn = (message) => core.warning(message);

    const getSarifRules = (sarif) => {
        try {
            return sarif["runs"][0]["tool"]["driver"]["rules"];
        } catch (error) {
            warn(`got error while getting rules from sarif file: ${error}`)
            return null;
        }
    }

    const rules = getSarifRules(sarifJSON);

    if (!rules)
        fail(`Expected to get sarif rules, but recieved ${rules}`);

    for (const rule of rules) {
        const location = rule["help"]["text"].split("\nLocation: ")[1].split("\n")[0];

        const locationSet = location.length != 0;

        if (!locationSet && assertLocationSet) {
            fail(`Expected rule ${rule["id"]} to have Location set in sarif data!`)
        }

        if (locationSet && !assertLocationSet) {
            fail(`Expected ${rule["id"]} location to be empty, but is set to ${location}`)
        }
    }


};

