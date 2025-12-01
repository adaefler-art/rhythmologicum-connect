const fs = require('fs');
const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';
const TOKEN = 'your_personal_access_token'; // replace with your GitHub token
const REPO_OWNER = 'adaefler-art';
const REPO_NAME = 'rhythmologicum-connect';

// Load issues from JSON file
const loadIssues = () => {
    const data = fs.readFileSync('github_v0_2_issue_export.json');
    return JSON.parse(data);
};

// Create label in GitHub
const createLabel = async (name, color) => {
    await axios.post(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/labels`, {
        name,
        color,
    }, {
        headers: {
            Authorization: `token ${TOKEN}`,
        },
    });
};

// Create issues in GitHub
const createIssues = async (issues) => {
    for (const issue of issues) {
        await axios.post(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
            title: issue.title,
            body: issue.body,
            labels: issue.labels,
        }, {
            headers: {
                Authorization: `token ${TOKEN}`,
            },
        });
    }
};

// Setup project board (Assuming you want to create a project for the issues)
const setupProjectBoard = async () => {
    const project = await axios.post(`${GITHUB_API_URL}/orgs/${REPO_OWNER}/projects`, {
        name: 'Imported Issues',
        body: 'Project board created for imported issues.',
    }, {
        headers: {
            Authorization: `token ${TOKEN}`,
        },
    });
    return project.data;
};

const main = async () => {
    const issues = loadIssues();
    for (const issue of issues) {
        await createLabel(issue.label.name, issue.label.color);
    }
    await createIssues(issues);
    await setupProjectBoard();
};

main().catch(console.error);