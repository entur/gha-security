const getRepositoryExtensions = async (glob) => {
    const globber = await glob.create('**', { matchDirectories: false });
    const repoFileExtensions = [... new Set(             // Unique array
        (await globber.glob())                        // Traverse current folder
        .map(f => f.slice(f.lastIndexOf('/') + 1))  // Get the filename
        .filter(f => f.lastIndexOf('.') > -1)       // Remove filenames without extension
        .map(f => f.slice(f.lastIndexOf('.') + 1))  // Get the extension
    )];

    return repoFileExtensions
}

const extractCommaList = (value) => {
    return value.split(',')
        .map(f => f.trim().toLowerCase())
        .filter(e => e !== '');
}

const getLanguagesForScanning = (fileExtensions, languageList, ignoreList, isCodeQL) => {
    return [... new Set(
        fileExtensions
        // check if any of the values in languageList contains file extension
        .filter(extension => Object.values(languageList).some(arr => arr.includes(extension)))
        // get language from value
        .map(extension => Object.keys(languageList).find(key => languageList[key].includes(extension)))
        ), isCodeQL ? 'actions' : '']
    .filter(f => f !== '' && !ignoreList.includes(f))
}

const IsHtmlOnlyScan = (fileExtensions, htmlFileExtensions, javascriptFileExtensions) => {
    const hasJavascriptFileExtension = fileExtensions.some(f => javascriptFileExtensions.includes(f));
    const hasHtmlFileExtension = fileExtensions.some(f => htmlFileExtensions.includes(f));
    return !hasJavascriptFileExtension && hasHtmlFileExtension 
}

module.exports = async ({ core, glob }) => {
    const htmlFileExtensions = [
        'vue', 'ejs', 'htm', 'html', 'xhtm', 'xhtml'
    ];
    
    const javascriptFileExtensions = [
        'ts', 'tsx', 'mts', 'cts', // typescript
        'js', 'jsx', 'cjs', 'mjs', 'es', 'es6' // javascript
    ];

    const supportedCodeqlLanguages = {
        'javascript-typescript': [...htmlFileExtensions, ...javascriptFileExtensions],
        'python': ['py'],
        'ruby': ['rb', 'erb', 'gemspec', 'gemfile'],
        'swift': ['swift'],
        'kotlin': ['kt'],
        'java': ['java'],
        'csharp': ['sln', 'csproj', 'cs', 'cshtml', 'xaml'],
        'go': ['go'],
        'cpp': ['cpp', 'c++', 'cxx', 'hpp', 'hh', 'h++', 'hxx', 'c', 'cc', 'h'],
    };

    const supportedSemgrepLanguages = {
        'scala': ['scala', 'sc'],
    };

    const languagesToIgnore = extractCommaList(process.env.IGNORE_LANGUAGE)

    const repositoryFileExtensions = process.env.OVERRIDE_EXTENSIONS !== "NO_OVERRIDE" ? extractCommaList(process.env.OVERRIDE_EXTENSIONS) : await getRepositoryExtensions(glob);

    // Ignore language "javascript-typescript" if HTML file type(s) is found and no additional javascript file types is found.
    // Needed after CodeQL 2.23.5, see issue: https://github.com/github/codeql/issues/21048

    const htmlOnlyScan =  IsHtmlOnlyScan(repositoryFileExtensions, htmlFileExtensions, javascriptFileExtensions)

    if (htmlOnlyScan && languagesToIgnore.includes("html")) {
        languagesToIgnore.push("javascript-typescript")
    }

    const codeqlLanguages = getLanguagesForScanning(repositoryFileExtensions, supportedCodeqlLanguages, languagesToIgnore, true);
    const semgrepLanguages = getLanguagesForScanning(repositoryFileExtensions, supportedSemgrepLanguages, languagesToIgnore, false);

    core.setOutput("codeql_languages", codeqlLanguages);
    core.setOutput("semgrep_languages", semgrepLanguages);
    core.setOutput("html_only_scan", htmlOnlyScan ? "True" : "False");
}