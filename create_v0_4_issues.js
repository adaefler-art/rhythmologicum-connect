// Usage:
// 1) npm install @octokit/rest
// 2) export GITHUB_TOKEN=ghp_...
// 3) node create_v0_4_issues.js

import fs from "fs";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const OWNER = "adaefler-art";
const REPO = "rhythmologicum-connect";

async function createIssues() {
  const raw = fs.readFileSync("./v0_4_issues.json", "utf8");
  const data = JSON.parse(raw);

  for (const epic of data.epics) {
    console.log(`Creating epic: ${epic.title}`);
    const epicIssue = await octokit.rest.issues.create({
      owner: OWNER,
      repo: REPO,
      title: epic.title,
      body: epic.body,
      labels: epic.labels
    });

    const epicNumber = epicIssue.data.number;

    if (epic.issues && epic.issues.length > 0) {
      for (const issue of epic.issues) {
        console.log(`  Creating child issue: ${issue.title}`);
        const childBody = `${issue.body}\n\nParent Epic: #${epicNumber}`;
        const child = await octokit.rest.issues.create({
          owner: OWNER,
          repo: REPO,
          title: issue.title,
          body: childBody,
          labels: issue.labels || []
        });

        await octokit.rest.issues.addLabels({
          owner: OWNER,
          repo: REPO,
          issue_number: child.data.number,
          labels: ["child"]
        });
      }
    }
  }
}

createIssues().catch(err => {
  console.error("Error creating issues:", err);
  process.exit(1);
});
