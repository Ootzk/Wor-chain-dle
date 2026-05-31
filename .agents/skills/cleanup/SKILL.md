---
name: cleanup
description: feature 브랜치 머지 후 로컬 정리 (release 전환, pull, 브랜치 삭제, prune)
---

# Post-Merge Cleanup

Use this workflow after a feature PR has been merged into a release branch.

## Goal

Return the local checkout to the relevant release branch, update it, delete the merged feature branch, and prune stale remote refs.

## Steps

1. Identify the current feature branch.
2. Identify the target release branch.
   - If the current branch is a feature branch, infer the release branch from branch history when possible.
   - If inference is uncertain, ask the developer.
3. Switch to the release branch:

   ```bash
   git switch <release-branch>
   ```

4. Pull the latest remote state:

   ```bash
   git pull
   ```

5. Delete the merged local feature branch:

   ```bash
   git branch -d <feature-branch>
   ```

6. Prune stale remote-tracking branches:

   ```bash
   git remote prune origin
   ```

7. Report the cleanup result.

Never force-delete a branch unless the developer explicitly asks.
