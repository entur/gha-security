module.exports = ({ core }) => {
    const fs = require('fs');
    const path = require('path');

    const destination = process.env.DESTINATION;
    const assertStalePackRemoved = process.env.STALE_PACK == "true";

    const fail = (message) => core.setFailed(message);

    const trustedOwnerModel = "models/trusted-owner.model.yml";
    const requiredFiles = ["codeql-pack.yml", trustedOwnerModel];
    const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(destination, file)));

    if (missingFiles.length != 0) {
        fail(`Expected model pack file(s) ${missingFiles.join(", ")} to be installed in ${destination}`);
        return;
    }

    const trustedOwners = fs.readFileSync(path.join(destination, trustedOwnerModel), 'utf8');

    if (!trustedOwners.includes('["entur"]'))
        fail(`Expected entur to be listed as a trusted Actions owner in ${destination}/${trustedOwnerModel}`);

    if (assertStalePackRemoved && fs.existsSync(path.join(destination, "stale.model.yml")))
        fail(`Expected stale.model.yml to be removed when reinstalling the model pack in ${destination}`);
}
