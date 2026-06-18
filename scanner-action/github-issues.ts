import * as core from "@actions/core";
import { type Octokit, RequestError } from "octokit";

interface GithubIssue {
	owner: string;
	repo: string;
	issue_number: number;
}

const sendIssueComment = async (issue: GithubIssue, body: string, octokit: Octokit) => {
	try {
		await octokit.rest.issues.createComment({
			...issue,
			body,
		});
	} catch (error) {
		if (!(error instanceof RequestError)) {
			throw Error(`Failed to create pull request comment for issue: ${issue.issue_number}`, { cause: error });
		}

		if (error.status === 403) {
			core.warning(`Not allowed to create comment for issue: ${issue.issue_number}`);
		} else {
			core.warning(`Failed to create pull request comment for issue: ${issue.issue_number}`);
		}
	}
};

const fetchIssueComments = async (issue: GithubIssue, octokit: Octokit) => {
	try {
		const response = await octokit.paginate(
			octokit.rest.issues.listComments,
			{
				...issue,
			},
			(response) => response.data,
		);

		return response;
	} catch (error) {
		if (!(error instanceof RequestError)) {
			throw Error(`Failed to fetch issue comments for issue: ${issue.issue_number}`, { cause: error });
		}

		if (error.status === 404) {
			core.warning(`No comments found for issue: ${issue.issue_number}`);
			return null;
		}
	}

	return null;
};

const removeIssueComment = async (issue: GithubIssue, subtext: string, octokit: Octokit) => {
	const comments = await fetchIssueComments(issue, octokit);

	if (comments === null) return;

	for (const comment of comments) {
		const isActionComment = comment.user?.login === "github-actions[bot]";
		const commentContainsSubtext = comment.body?.includes(subtext);
		const skipComment = !isActionComment || !commentContainsSubtext;

		if (skipComment) return;

		try {
			await octokit.rest.issues.deleteComment({
				...issue,
				comment_id: comment.id,
			});
		} catch (error) {
			core.warning(`Failed to remove comment ${comment.id} for issue: ${issue.issue_number} with subtext ${subtext}`);
		}
	}
};

export { sendIssueComment, removeIssueComment };
