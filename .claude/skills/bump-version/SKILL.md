---
name: bump-version
description: 프로젝트 내 모든 버전 정보를 일괄 업데이트합니다.
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(npm version *)
argument-hint: <version> (e.g. 1.1.0)
---

# Version Bump

인자로 전달된 버전($ARGUMENTS)으로 프로젝트 내 모든 버전 정보를 업데이트하세요.

## 업데이트 대상

1. `package.json` → `"version"` 필드
2. `src/constants/config.ts` → `PATCH_NOTES_VERSION` 상수
3. `README.md` → 버전 뱃지 (`![Version](https://img.shields.io/badge/Version-v...-blue)`)

## 절차

1. `npm version $ARGUMENTS --no-git-tag-version` 으로 package.json, package-lock.json 업데이트
2. `src/constants/config.ts`의 `PATCH_NOTES_VERSION` 값을 `'$ARGUMENTS'`로 변경
3. `README.md`의 버전 뱃지를 `v$ARGUMENTS`로 변경
3. 변경된 파일 목록을 사용자에게 보여줌 (커밋은 하지 않음)
