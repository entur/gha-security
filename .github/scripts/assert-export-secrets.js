module.exports = ({ core }) => {
    const exportSecrets = process.env.EXPORT_SECRETS.split(",");
    const secrets = JSON.parse(process.env.SECRETS);

    for (const exportSecret of exportSecrets) {
        if (!secrets[exportSecret])
            core.setFailed(`Test secret ${exportSecret} is not defined, is it configured in repository?`);

        if (process.env[exportSecret] != secrets[exportSecret])
            core.setFailed(`Failed to expose secret ${exportSecret}`);
    }
}
