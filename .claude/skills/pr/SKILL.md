---
name: pr
description: 현재 브랜치의 PR을 생성합니다 (label, assignee, milestone, development 자동 설정).
allowed-tools: Bash(git *), Bash(gh *), Read, Grep
---

# PR 생성

현재 브랜치 유형에 따라 적절한 PR을 생성합니다.

- `feature/*` 브랜치 → `release/*` 브랜치로 PR
- `release/*` 브랜치 → `main`으로 PR

## 절차

1. **브랜치 유형 판별**
   - 현재 브랜치가 `feature/*`이면 → feature PR 흐름
   - 현재 브랜치가 `release/*`이면 → release PR 흐름
   - 둘 다 아니면 중단하고 사용자에게 안내

2. **사전 확인**
   - `git log`로 base 브랜치 대비 커밋 목록 확인.
   - `git diff <base>...HEAD`로 변경 내용 파악.

3. **PR 메타데이터 결정**

   ### Feature PR (feature → release)

   - **base**: 대상 release 브랜치 (브랜치 히스토리에서 추론, 불확실하면 사용자에게 질문)
   - **title**: 변경 내용 요약 (70자 이내). conventional commit 접두사 사용 (feat:, fix:, docs:, style:, refactor:, test:, ci:, chore:).
   - **label**: 변경 내용에 맞는 라벨 선택 (복수 가능):
     - `✨ enhancement` — 새 기능
     - `🐛 bug` — 버그 수정
     - `📝 documentation` — 문서
     - `🎨 UI/UX` — 디자인/UI 개선
     - `💰 donation` — 후원 관련
     - `🧑‍💻 devops` — 개발 환경/CI/테스트
     - `💥 breaking change` — 호환성 깨지는 변경
     - `browser: chrome`, `browser: safari`, `platform: PC`, `platform: mobile` — 해당 시
   - **milestone**: base release 브랜치의 버전 (예: release/v1.4.0 → `v1.4.0`). milestone이 없으면 `gh api`로 먼저 생성.
   - **assignee**: `Ootzk`
   - **body**: 관련 이슈가 있으면 `Closes #이슈번호` 포함. Summary + Test plan 형식.

   ### Release PR (release → main)

   - **base**: `main`
   - **title**: 반드시 `Release v{version}` 형식 (예: `Release v1.4.0`). 브랜치명에서 버전 추출.
   - **label**: `🔖 versioning` (필수). 추가 라벨은 내용에 따라.
   - **milestone**: 해당 release 버전.
   - **assignee**: `Ootzk`
   - **body**: 이 body가 GitHub Release 본문으로 자동 사용됨. 아래 내용을 포함:
     - `Closes #이슈번호` — 이 release에서 해결된 **모든** 이슈를 나열 (Development sidebar 자동 연결 + 자동 close)
     - release에 포함된 주요 변경 사항 요약 (머지된 PR 목록 기반)

4. **원격 push 및 PR 생성**
   - 원격에 push되지 않았으면 `git push -u origin <branch>`.
   - PR 생성:
     ```
     gh pr create \
       --repo Ootzk/Wor-chain-dle \
       --base <base-branch> \
       --title "<title>" \
       --label "<label1>" --label "<label2>" \
       --assignee Ootzk \
       --milestone "<version>" \
       --body "$(cat <<'EOF'
     Closes #이슈번호 (있는 경우)

     ## Summary
     - ...

     ## Test plan (feature PR만)
     - ...

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     EOF
     )"
     ```

5. **결과 출력**: PR URL을 사용자에게 보여줌.
