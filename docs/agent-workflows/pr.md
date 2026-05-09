# Pull Request Workflow

Use this workflow to create pull requests for feature branches and release branches.

Always pass `--repo Ootzk/Wor-chain-dle` to GitHub CLI commands that can infer a repository. This repo has both `origin` and `upstream`, so implicit detection can target the wrong repository.

## Branch Types

- `feature/*` or any non-`main`, non-`release/*` branch: create a feature PR into the target release branch.
- `release/*`: create a release PR into `main`.
- `main`: stop and tell the developer that PRs are not created directly from `main`.

## Preflight

1. Check the current branch:

   ```bash
   git branch --show-current
   ```

2. Check working tree state:

   ```bash
   git status --short --branch
   ```

3. Identify the base branch.
   - Feature PR: target release branch, usually inferred from branch history or the active release.
   - Release PR: `main`.
4. Review commits and diff:

   ```bash
   git log --oneline <base>..HEAD
   git diff <base>...HEAD
   ```

## Feature PR Metadata

- Base: target release branch, for example `release/v1.6.0`.
- Title: concise, 70 characters or less, with a conventional commit prefix such as `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `ci:`, or `chore:`.
- Labels: choose relevant labels:
  - `✨ enhancement`: new feature.
  - `🐛 bug`: bug fix.
  - `📝 documentation`: documentation.
  - `🎨 UI/UX`: design or UI improvement.
  - `💰 donation`: donation-related change.
  - `🧑‍💻 devops`: development environment, CI, or testing.
  - `💥 breaking change`: incompatible behavior.
  - `🌐 i18n`: translations or locale behavior.
  - `browser: chrome`, `browser: safari`: browser-specific change.
  - `platform: PC`, `platform: mobile`: platform-specific change.
- Milestone: target release version, for example `v1.6.0`. Create it first if missing.
- Assignee: `Ootzk`.
- Body: include related issues with `Closes #issue` as a reference, plus Summary and Test plan.

Feature PRs target release branches, so GitHub may not auto-close issues or populate the Development sidebar until the release PR. Manual linking may be needed.

## Release PR Metadata

- Base: `main`.
- Title: exactly `Release v{version}`, for example `Release v1.6.0`.
- Label: `🔖 versioning` is required. Add other labels only when useful.
- Milestone: release version.
- Assignee: `Ootzk`.
- Body: this becomes the GitHub Release body. Include:
  - `Closes #issue` for every issue completed in the release.
  - Summary of major changes included in the release.

## Push And Create

1. Push the current branch if needed:

   ```bash
   git push -u origin <branch>
   ```

2. Create the PR:

   ```bash
   gh pr create \
     --repo Ootzk/Wor-chain-dle \
     --base <base-branch> \
     --title "<title>" \
     --label "<label1>" \
     --assignee Ootzk \
     --milestone "<version>" \
     --body "<body>"
   ```

3. Report the PR URL.

PR merges are always performed by the developer, not by agents.
