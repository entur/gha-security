module.exports = ({ core }) => {
    const exportSecrets = process.env.EXPORT_SECRETS.split(",");
    
    for (const exportSecret of exportSecrets) {
    if (process.env[exportSecret] != "")
        core.setFailed(`Failed to clear secret ${exportSecret}`);
    }
}