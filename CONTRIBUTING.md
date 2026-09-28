# Contributing

Welcome to Entur gha-security repository, where we host actions and reusable workflows for our Github Advanced Security setup.

The reusable workflows we release are
- [Code Scan](/.github/workflows/code-scan.yml)
- [Docker Scan](/.github/workflows/docker-scan.yml)

## Self-repository Syntax
When referencing an action from gha-security in reusable workflow, use self-repository syntax.

### Example
```
- name: "Setup Java for Scala"
  uses: $/.github/actions/setup-java-code-scan
  ...
```

See [Github release blog](https://github.blog/changelog/2026-07-30-reference-same-repository-actions-with-self-repository-syntax/) for more details


## Github Composite Actions
The repository tries to use composite action where possible for the following reasons
* Easier to test
* Reduce complexity in the reusable workflows
* Work with code in .js files instead of the yaml file

## Commit pinning
> [!NOTE]
> Remember to add `# vX.Y.Z` for dependabot update support

Pin actions and reusable workflows outside of Entur org.

### Example
```
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

## What is a breaking change?
List over changes that have previously broken a setup for a developer using gha-security.

#### Changing a permission in reusable workflow
If you change a permission in the reusable workflows, it needs to be treated as a breaking change.
Adding a new permission that was previously not given can cause break callers of the reusable workflow.

## Commit
Commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification and be structured in the following format:  
```
<type>: <commit message>
```

## Pull Requests

### Name
The following pull request naming conventions MUST be adhered to:  
```
<type>[optional scope]: <description>
```

The type SHOULD follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

#### Examples
- chore: Updated dependencies
- chore(deps): Updated dependencies

### Description

**Use the [Pull Request Template](/.github/pull_request_template.md) as a basis.**   
However, you MAY remove non-relevant sections from the template if they do not apply to the contents of the pull request.  
E.g. a README update does not need to include a checkbox for:  
`I have verified that the project runs as expected after the new changes `

## Releases

We use `entur/gha-meta/.github/workflows/release.yml` for new releases, which uses [Google release please](https://github.com/googleapis/release-please).

If there are no existing PR, it will create a new PR when a pull request with title that starts with `fix:` or `feat:`

### What to do before a release
1. Run test workflow in [sec-gha-tests](https://github.com/entur/sec-gha-tests)
2. Compare [changes between v2 and main](https://github.com/entur/gha-security/compare/v2...main)
3. Prepare new release message with changes to be sent in Slack channel `#talk-sikkerhet`
4. Approve release-plase PR
5. Merge the pull request
6. Send slack message when release shows up under [releases](https://github.com/entur/gha-security/releases)