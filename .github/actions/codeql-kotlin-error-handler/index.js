// Github doesn't have a way to get previous log lines of a job.
// So we take advantage of the logs being stored in the actions-runner, so we can look for the error line from CodeQL autobuild.
// NOTE: if Github one day, allows you to read logs using Official API, then use that instead.
const getActionRunnerLog = async (fs, glob) => {
    try {
        // Globber is used here to fetch the files, there is usually 2 files generated here.
        // One for the log of current step, and one for the entire job.
        const globber = await glob.create("~/actions-runner/cached/*/_diag/blocks/*", {
            followSymbolicLinks: false
        });

        const files = await globber.glob();

        return files.map(file => fs.readFileSync(file, 'utf8')).join("\n");

    } catch (error) {
        throw new Error("Failed to get action runner log", { cause: error })
    }
}

module.exports = async ({ core, glob }) => {
    // This action does not support macOS/Windows
    if (process.env.RUNNER_OS != "Linux")
        return;

    const fs = require('fs');
    
    const actionRunnerLog = await getActionRunnerLog(fs, glob);
    const supportErrorMessage = actionRunnerLog
        .split("\n")
        .find(line =>
            /Kotlin version (.*) is too recent. CodeQL currently supports versions below (.*)/.test(line));

    // if no message found related to CodeQL kotlin support, silently quit
    if (!supportErrorMessage)
        return;

    const matches = supportErrorMessage.match(/Kotlin version (.*) is too recent. CodeQL currently supports versions below (.*)/)

    const [_, kotlinVersion, incompatibleKotlinVersion] = matches;


    await core.summary
        .addHeading(`CodeQL analysis failed with too recent Kotlin version`)
        .addRaw(`Kotlin ${kotlinVersion} version too recent for CodeQL, CodeQL supports versions below ${incompatibleKotlinVersion}.`)
        .addBreak()
        .addRaw("To continue using Code Scan, please wait with Kotlin upgrade until it's supported by CodeQL.")
        .addBreak()
        .addBreak()
        .addRaw('See <a href="https://Github.com/Github/codeql/issues?q=is%3Aissue%20Support%20Kotlin">Github issues</a> for status on CodeQL Kotlin Support')
        .addSeparator()
        .write()


    core.setFailed(`Kotlin ${kotlinVersion} version too recent for CodeQL, CodeQL supports versions below ${incompatibleKotlinVersion}. See job summary for details`)
}