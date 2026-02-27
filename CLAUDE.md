# Wor-chain-dle — Development Guide

Wordle meets word chain — guess the word while chaining letters in a snake pattern.

Based on [AnyLanguage-Word-Guessing-Game](https://github.com/roedoejet/AnyLanguage-Word-Guessing-Game) fork.

## Tech Stack

- React 17 + TypeScript + Tailwind CSS 3
- Create React App (react-scripts 5)
- i18next (en, ko, ja, es, sw, zh)
- GoatCounter 애널리틱스 (쿠키 없음, 경량)
- GitHub Actions → GitHub Pages 자동 배포

## Project Structure

```text
src/
  App.tsx                        ← 게임 메인 로직 (onChar, onDelete, onEnter)
  constants/
    config.ts                    ← 게임 설정 (tries, wordLength, language 등)
    orthography.ts               ← 문자 체계 정의 (유효 문자 집합)
    wordlist.ts                  ← 정답 단어 목록 (2,315개, 고정 시드 셔플)
    validGuesses.ts              ← 유효 추측 단어 목록 (10,656개, 정답과 중복 없음)
  lib/
    words.ts                     ← 오늘의 단어 선택 (UTC 기반), 단어 검증
    statuses.ts                  ← 글자 상태 판정 (correct/present/absent)
    chain.ts                     ← 체인 규칙 유틸 (체인 인덱스, dead end 판정)
    share.ts                     ← 공유 텍스트 생성 (이모지 그리드 + box-drawing 체인 경로)
    customPuzzle.ts              ← Custom 퍼즐 인코딩/디코딩 (URL-safe Base64)
    tokenizer.ts                 ← orthography 기반 단어 토큰화
  components/
    grid/                        ← 게임 그리드 UI (green=correct, purple=present, ChainBridge)
    keyboard/                    ← QWERTY 키보드 UI + 물리 키보드 지원 (e.code 기반, IME 호환)
    modals/                      ← Info, Stats, About, Translate 모달
    pages/
      CreatePuzzlePage.tsx       ← 문제 출제 페이지 (단어 입력 + URL 생성)
```

## Development

```bash
npm install
npm start          # 로컬 개발 서버 (http://localhost:3000)
npm run build      # 프로덕션 빌드
npm test           # 테스트
npm run lint       # prettier 체크
npm run fix        # prettier 자동 포맷
```

Docker:

```bash
docker build -t wor-chain-dle .
docker run -d -p 3000:3000 wor-chain-dle
```

## Deployment

- `main` 브랜치에 push 시 GitHub Actions가 `gh-pages` 브랜치로 자동 배포.
- 수동 배포: `npm run deploy`

## Project Management

- **GitHub Project Board**: https://github.com/users/Ootzk/projects/3 에서 작업 관리.
- 작업 단위는 보드의 이슈로 추적하되, 즉흥적으로 개발하는 경우도 있음. 그 경우에도 연관 작업끼리 PR 단위로 묶어 보드에 연동.

## Git Branching Strategy

- `main`: 항상 배포 가능한 상태. 머지될 때마다 버전 태그 등록.
- `release/{version}`: 다음 버전 개발 브랜치. main에서 생성. 해당 버전이 어느 정도 완성되면 main으로 PR을 보내서 머지.
- `feature/{contents}`: 기능별 브랜치. release 브랜치에서 생성. 작업 완료 후 release 브랜치로 PR을 만들어서 머지.
- **PR 머지는 항상 개발자가 직접 수행.** Claude는 PR 생성까지만.
- **PR 생성 시 반드시 `--repo Ootzk/Wor-chain-dle`을 명시한다.** 이 프로젝트는 fork 기반이므로, `--repo` 없이 `gh pr create`를 실행하면 upstream(원본 저장소)으로 PR이 올라갈 수 있다.

## Version Management

코드 내 버전 정보가 있는 곳:
- `package.json` → `"version"` 필드
- `src/constants/config.ts` → `PATCH_NOTES_VERSION` 상수
- `README.md` → 버전 뱃지

`release/{version}` 브랜치를 `main`으로 PR할 때 위 값들이 해당 버전과 반드시 일치해야 한다. `/bump-version` 스킬로 일괄 업데이트 가능.

## Game Modes

| 항목 | Daily | Practice | Custom |
| ------ | ------- | ---------- | -------- |
| 정답 출처 | WORDS (매일 UTC 리셋) | WORDS (랜덤) | 출제자 지정 (WORDS + VALIDGUESSES) |
| 통계 저장 | `gameStats` | X | `customGameStats` |
| 게임 상태 저장 | O | X | X |
| Share 버튼 | O | X | O (Custom 포맷) |
| URL | `/#/` | `/#/` (Practice 버튼) | `/#/custom/:code` |

- **Custom URL 인코딩**: `btoa("word_questioner")` → URL-safe Base64 (`+`→`-`, `/`→`_`, `=` 제거)
- **출제 페이지**: `/#/create` — Keyboard 컴포넌트 재사용, 셀은 readOnly (모바일 가상 키보드 억제)
- **출제자 이름**: 최대 10자 제한 (오버레이 깨짐 방지)

## Snake Chain Rule

2번째 추측부터 이전 추측과 체인으로 연결되어야 함. 연결 위치가 좌우 교대로 바뀌며 뱀 모양을 형성:

- guess 1 → 2: **끝 글자** 일치 (오른쪽 연결)
- guess 2 → 3: **첫 글자** 일치 (왼쪽 연결)
- guess 3 → 4: **끝 글자** 일치 (오른쪽 연결)
- guess 4 → 5: **첫 글자** 일치 (왼쪽 연결)
- guess 5 → 6: **끝 글자** 일치 (오른쪽 연결)

홀수→짝수: 끝 글자 체인, 짝수→홀수: 첫 글자 체인. (1-indexed 기준)

검증 위치: `App.tsx`의 `onEnter()` — 단어 길이 체크 후, 단어 목록 체크 전에 체인 규칙 검증.

## Version History

- **v0.1.0** — AnyLanguage-Wordle 포크 초기 세팅. 기본 색상 변경 (purple/orange).
- **v0.2.0** — 문서 정비, 영어 Wordle 기본 구현, QWERTY 키보드 + 물리 키보드 지원, UI 변경 (타이틀, 타일 색상).
- **v1.0.0** — Snake chain rule 구현, 체인 시각화(ChainBridge), dead end 감지, How to Play 리디자인, wordlist 고정 시드 셔플(UTC 리셋), Share 포맷 리디자인(box-drawing 체인 경로), GitHub Pages 배포.
- **v1.0.1** — 버전 업데이트, 프로젝트 문서 정비.
- **v1.0.2** — 탭 타이틀 및 파비콘 Wor🔗dle 브랜딩 적용.
- **v1.0.3** — GoatCounter 애널리틱스 연동, 문서 업데이트.
- **v1.1.0** — Practice 모드, Settings(대문자 토글), 다국어 지원(6개 언어), 후원 모달, 패치노트 팝업, README 전면 개편.

## Communication

- 한국어로 소통.
