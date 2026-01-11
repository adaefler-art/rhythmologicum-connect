# GitHub Project Automation Blueprint – v0.4 Subtasks (Minimal)

Idea:
- Add label `create-subtasks` to an epic.
- A GitHub Action (triggered on `issues:labeled`) calls a script to create child issues.

Example workflow skeleton:

```yaml
name: Auto-create subtasks for epics

on:
  issues:
    types: [labeled]

jobs:
  create_subtasks:
    if: github.event.label.name == 'create-subtasks'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install @octokit/rest
      - name: Create subtasks
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/create_subtasks_for_epic.js ${{ github.event.issue.number }}
```
