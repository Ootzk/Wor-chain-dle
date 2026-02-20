---
name: cleanup
description: feature 브랜치 머지 후 로컬 정리 (release 전환, pull, 브랜치 삭제, prune)
disable-model-invocation: true
allowed-tools: Bash(git *)
---

# Post-Merge Cleanup

feature 브랜치가 머지된 후 로컬 환경을 정리합니다.

## 절차

1. 현재 브랜치 이름을 확인하여 삭제 대상 feature 브랜치를 파악
2. release 브랜치를 식별 (현재 브랜치가 feature면 대상 release 브랜치를 `git log --oneline --decorate`에서 추론, 아니면 사용자에게 질문)
3. 아래 명령을 순서대로 실행:

```
git checkout <release-branch>
git pull
git branch -d <feature-branch>
git remote prune origin
```

4. 정리 결과를 사용자에게 보여줌
