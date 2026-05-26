---
name: bump-version
description: 프로젝트 내 모든 버전 정보를 일괄 업데이트합니다.
argument-hint: <version> (e.g. 1.7.0)
---

# Version Bump

Use this workflow to update project version metadata before a release PR.

## Inputs

- Target version, for example `1.7.0`.

Use full semantic versions. In code/config use the bare form such as `1.7.0`; in release labels, branch names, issue/PR text, and docs use the `v`-prefixed form such as `v1.7.0`. Do not omit the patch component.

## Files To Update

- `package.json`: `version`
- `package-lock.json`: lockfile version metadata, updated by `npm version`
- `src/constants/config.ts`: `PATCH_NOTES_VERSION`

The README release badge is generated from GitHub Releases and does not need manual version edits.

## Steps

1. Confirm the target version with the developer if it is not explicit.
2. Run:

   ```bash
   npm version <version> --no-git-tag-version
   ```

3. Update `PATCH_NOTES_VERSION` in `src/constants/config.ts` to the same version string.
4. Check the diff and make sure only expected version files changed.
5. Report changed files to the developer.

Do not create a Git tag and do not commit unless the developer explicitly asks.
