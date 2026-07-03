const doesArraysContainSameItems = (array1, array2) => {
    const sortedArray1 = array1.sort();
    const sortedArray2 = array2.sort();
    
    return sortedArray2.length == sortedArray2.length && sortedArray1.every((value, index) => value === sortedArray2[index]);
}

module.exports = ({ core }) => {
    const expectedCodeQL = JSON.parse(process.env.EXPECTED_CODEQL_LANGUAGES) ?? []
    const actualCodeQL = JSON.parse(process.env.ACTUAL_CODEQL_LANGUAGES) ?? []

    if (!doesArraysContainSameItems(expectedCodeQL, actualCodeQL))
        core.setFailed(`assert codeql languages expected: ${expectedCodeQL.join(",")} actual: ${actualCodeQL.join(",")}`)

    const expectedSemgrep = JSON.parse(process.env.EXPECTED_SEMGREP_LANGUAGES) ?? []
    const actualSemgrep = JSON.parse(process.env.ACTUAL_SEMGREP_LANGUAGES) ?? []

    if (!doesArraysContainSameItems(expectedSemgrep, actualSemgrep))
        core.setFailed(`assert codeql languages expected: ${expectedSemgrep.join(",")} actual: ${actualSemgrep.join(",")}`)
}