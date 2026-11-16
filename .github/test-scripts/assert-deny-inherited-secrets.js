module.exports = ({ core }) => {
    const shouldFail = process.env.SHOULD_FAIL === 'true';
    const failed = process.env.OUTCOME === 'failure';

    if (shouldFail !== failed) {
        core.setFailed(`Expected outcome to be ${shouldFail ? 'failure' : 'success'}, got ${process.env.OUTCOME}`);
    }
}
