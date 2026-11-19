module.exports = async ({ core }) => {
    const allowedSecrets = [
        'github_token',
        ...process.env.ALLOWED_SECRETS.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '')
    ];

    const unexpectedSecrets = Object.keys(JSON.parse(process.env.SECRETS))
        .filter(s => !allowedSecrets.includes(s.toLowerCase()));

    if (unexpectedSecrets.length > 0) {
        core.setFailed(`"secrets: inherit" is not supported. Pass only the secrets you need. Unexpected secrets: ${unexpectedSecrets.join(', ')}`);
    }
}
