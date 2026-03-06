# Wor-chain-dle — Development Guide

Wordle meets word chain — guess the word while chaining letters in a snake pattern.

Based on [AnyLanguage-Word-Guessing-Game](https://github.com/roedoejet/AnyLanguage-Word-Guessing-Game) fork.

## Tech Stack

- React 17 + TypeScript + Tailwind CSS 3
- Create React App (react-scripts 5)
- React Router v5 (HashRouter)
- i18next (en, ko, ja, es, sw, zh — 번역 리소스 JS 번들 인라인)
- Playwright (E2E 테스트 — Chromium, WebKit, iPhone 13, Pixel 5)
- GoatCounter 애널리틱스 (쿠키 없음, 경량)
- GitHub Actions → GitHub Pages 자동 배포

## Project Structure

```text
src/
  index.tsx                      ← HashRouter 라우팅 (/, /practice, /create, /custom/:code)
  App.tsx                        ← 게임 메인 로직 (onChar, onDelete, onEnter)
  i18n.ts                        ← i18next 설정 (번역 리소스 인라인 번들링)
  locales/{lang}/translation.json ← 번역 리소스 (en, ko, ja, es, sw, zh)
  constants/
    config.ts                    ← 게임 설정 (tries, wordLength, language, 결제 URL 등)
    orthography.ts               ← 문자 체계 정의 (유효 문자 집합)
    wordlist.ts                  ← 정답 단어 목록 (2,315개, 고정 시드 셔플)
    validGuesses.ts              ← 유효 추측 단어 목록 (10,656개, 정답과 중복 없음)
  lib/
    words.ts                     ← 오늘의 단어 선택 (UTC 기반), 단어 검증
    statuses.ts                  ← 글자 상태 판정 (correct/present/absent)
    chain.ts                     ← 체인 규칙 유틸 (체인 인덱스, dead end 판정)
    share.ts                     ← 공유 텍스트 생성 (이모지 그리드 + box-drawing 체인 경로 + 달력 월별 공유)
    dailyHistory.ts              ← 날짜별 게임 결과 기록 (Daily 전용, localStorage)
    customPuzzle.ts              ← Custom 퍼즐 인코딩/디코딩 (URL-safe Base64)
    tokenizer.ts                 ← orthography 기반 단어 토큰화
  components/
    grid/                        ← 게임 그리드 UI (green=correct, purple=present, ChainBridge)
    keyboard/                    ← QWERTY 키보드 UI + 물리 키보드 지원 (e.code 기반, IME 호환)
    calendar/                    ← 월별 달력 UI (CalendarDay 셀, 월 네비게이션, 공유)
    modals/                      ← Info, Stats, Settings, Calendar, Donate, PatchNotes, Translate 모달
    pages/
      CreatePuzzlePage.tsx       ← 문제 출제 페이지 (단어 입력 + URL 생성)
e2e/
  fixtures/game.fixture.ts       ← Playwright 테스트 픽스처 (gamePage, typeWord, submitWord 등)
  *.spec.ts                      ← E2E 테스트 (game-flow, chain-rule, keyboard, mobile, modals, navigation, calendar, share-exclude-url)
scripts/
  generate-readme-screenshots.spec.ts  ← README 스크린샷 자동 생성
  readme-screenshots.config.ts         ← 스크린샷 Playwright 설정
  shuffle-wordlist.js                  ← 단어 목록 셔플 스크립트
```

## Development

```bash
npm install
npm start              # 로컬 개발 서버 (http://localhost:3000)
npm run build          # 프로덕션 빌드
npm test               # 단위 테스트
npm run test:e2e       # Playwright E2E 테스트 (빌드 후 serve)
npm run test:e2e:ui    # Playwright UI 모드 (디버깅용)
npm run test:e2e:headed    # 브라우저 창 표시하며 E2E 실행
npm run test:e2e:mobile    # 모바일 디바이스만 E2E 실행
npm run readme:screenshots # README 스크린샷 자동 생성 (GENERATE_SCREENSHOTS=1)
npm run lint           # prettier 체크
npm run fix            # prettier 자동 포맷
```

Docker:

```bash
docker build -t wor-chain-dle .
docker run -d -p 3000:3000 wor-chain-dle
```

## Deployment

- PR 시: `test` 실행 (모든 PR), `e2e` 추가 실행 (main 대상 PR만).
- `main` 브랜치에 push 시: GitHub Actions가 `gh-pages` 브랜치로 자동 배포 + `package.json` 버전으로 Git 태그 생성 + GitHub Release 생성 (머지된 PR body 사용).
- E2E 아티팩트: Playwright HTML 리포트 30일 보관.
- 수동 배포: `npm run deploy`

## Project Management

- **GitHub Project Board**: https://github.com/users/Ootzk/projects/3 에서 작업 관리.
- 작업 단위는 보드의 이슈로 추적하되, 즉흥적으로 개발하는 경우도 있음. 그 경우에도 연관 작업끼리 PR 단위로 묶어 보드에 연동.
- 즉흥 PR의 경우, milestone을 머지 대상 release 버전으로 설정하여 버전별 작업 추적을 유지.

## Git Branching Strategy

- `main`: 항상 배포 가능한 상태. 머지될 때마다 버전 태그 등록.
- `release/{version}`: 다음 버전 개발 브랜치. main에서 생성. 해당 버전이 어느 정도 완성되면 main으로 PR을 보내서 머지. **PR 제목은 반드시 `Release v{version}` 형식** (예: `Release v1.2.0`). 이 PR의 body가 GitHub Release 본문으로 자동 사용됨.
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
| 날짜별 기록 | `dailyHistory` | X | X |
| 게임 상태 저장 | O | X | X |
| Share 버튼 | O | X | O (Custom 포맷) |
| 달력 | O (CalendarIcon) | X | X |
| URL | `/#/` | `/#/` (Practice 버튼) | `/#/custom/:code` |

- **Custom URL 인코딩**: `btoa("word_questioner")` → URL-safe Base64 (`+`→`-`, `/`→`_`, `=` 제거)
- **출제 페이지**: `/#/create` — Keyboard 컴포넌트 재사용, 셀은 readOnly (모바일 가상 키보드 억제)
- **출제자 이름**: 최대 10자 제한 (오버레이 깨짐 방지)

## Routing

HashRouter 기반 라우팅 (`src/index.tsx`):

| 경로 | 컴포넌트 | 모드 | 설명 |
| --- | --- | --- | --- |
| `/#/` | DailyPage | daily | UTC 기반 매일 고정 정답 |
| `/#/practice` | PracticePage | practice | 랜덤 단어 (매 접속마다 새로 생성) |
| `/#/create` | CreatePuzzlePage | — | 커스텀 퍼즐 출제 페이지 |
| `/#/custom/:code` | CustomPage | custom | Base64 디코딩 후 단어 검증, 실패 시 `/`로 리다이렉트 |

## E2E Testing (Playwright)

**설정**: `playwright.config.ts` — 4개 프로젝트(Desktop Chrome, Desktop Safari, iPhone 13, Pixel 5).

**테스트 픽스처** (`e2e/fixtures/game.fixture.ts`):

- `gamePage` 픽스처: 패치노트 모달 자동 억제 (localStorage에 `seenPatchNotesVersion` 설정)
- 헬퍼: `typeWord()`, `submitWord()`, `getRowCells()`, `waitForGameReady()`, `screenshot()`
- Custom 퍼즐 인코딩 로직을 테스트용으로 미러링

**테스트 카테고리** (`e2e/`):

- `game-flow.spec.ts` — 승리/패배, 검증 알림, 색상 정확도
- `chain-rule.spec.ts` — 체인 연결 검증, dead end, 턴 패턴
- `keyboard-input.spec.ts` — 물리 키보드, IME 호환성
- `mobile-responsive.spec.ts` — 반응형 레이아웃, 터치 인터랙션
- `modals.spec.ts` — 전체 모달 테스트 (모드별)
- `calendar.spec.ts` — 달력 모달, 월 네비게이션, 승패 인디케이터, 주 시작 설정, 공유
- `share-exclude-url.spec.ts` — 공유 시 URL 제외 설정 테스트
- `navigation.spec.ts` — 라우트 전환, 페이지 네비게이션

**서버**: CI는 사전 빌드된 아티팩트 사용 (`npx serve -s build -l 3000`), 로컬은 빌드 후 서브 (`npm run build && npx serve -s build -l 3000`). CI 워커 수: 1 (직렬 실행).

## README Screenshot Automation

`scripts/generate-readme-screenshots.spec.ts` — Playwright로 README용 스크린샷을 자동 생성.

- **실행**: `GENERATE_SCREENSHOTS=1 npm run readme:screenshots` (환경변수 없으면 skip)
- **설정**: `scripts/readme-screenshots.config.ts` — 모바일 최적화 뷰포트 (526×750 @2x), Chromium 단일 프로젝트
- **출력**: `assets/` 디렉토리에 PNG 저장
- **픽스처 재사용**: `e2e/fixtures/game.fixture.ts`의 `encodeCustomPuzzle`, `typeWord`, `submitWord` 등 활용

## Modal Architecture

- **InfoModal**: 탭 기반 모드별 콘텐츠 (`daily`, `practice`, `custom`, `create`). 각 모드에 맞는 How to Play 표시.
- **PatchNotesModal**: `seenPatchNotesVersion` (localStorage) < `PATCH_NOTES_VERSION` (config.ts) 이면 자동 표시. 첫 방문 시 새 기능 안내.
- **DonateModal**: 탭 기반 결제 수단 선택 (KakaoPay QR + Toss Pay). 결제 URL은 `config.ts`에 상수로 관리.
- **StatsModal**: 모드별 분리 저장 — Daily는 `gameStats`, Custom은 `customGameStats` 키 사용. `loadStats(storageKey?)`, `addStatsForCompletedGame(storageKey?)`.
- **SettingsModal**: 플랫 리스트 형태의 토글 3개 — 대문자 표시(`uppercaseLabel`), 주 시작 요일(`weekStartLabel`), 공유 시 URL 제외(`excludeUrlLabel`). 섹션 구분 없이 Toggle 컴포넌트 사용.
- **CalendarModal**: Daily 전용. 월별 달력 그리드로 게임 결과 시각화 (승리=초록, 패배=보라, 미참여=회색). 월 네비게이션, 스트릭 표시, 월별 이모지 공유 기능.

## Calendar & Daily History

Daily 모드 게임 완료 시 `dailyHistory` (localStorage)에 날짜별 결과 기록. 기존 `gameStats` 집계 통계와 독립적으로 동작.

**데이터 구조** (`src/lib/dailyHistory.ts`):

- `DayResult = { guessCount: number, won: boolean }` — 각 날짜의 게임 결과
- `DailyHistory = Record<number, DayResult>` — key는 solutionIndex (CONFIG.startDate epoch 기준 일수)
- localStorage 키: `dailyHistory` (결과), `dailyHistoryStartIndex` (달력 추적 시작 인덱스)

**달력 UI** (`src/components/calendar/`):

- `Calendar.tsx` — 42셀 그리드 (6행×7열), 월 네비게이션, 요일 헤더, 스트릭 표시, 월별 공유
- `CalendarDay.tsx` — 개별 셀: 승리(초록+횟수), 패배(보라), 미참여(회색), 미래/epoch 이전(비활성)
- 특수 날짜: Feb 16 = 🎂 (생일), calendarEpoch = 📅 (추적 시작일)

**설정**: `weekStartsOnMonday` (Settings 토글) — 요일 헤더 및 그리드 배치, 공유 텍스트에 반영.

**월별 공유** (`shareCalendar` in `share.ts`):

- 포맷: `Wor🔗dle 2026-03 (🔥 5)` + 요일 헤더 + 이모지 그리드 (🟩=승, 🟪=패, ⬜=미참여, ⚪=비활성)

## i18n (Internationalization)

번역 리소스를 JS 번들에 인라인하여 HTTP 백엔드 로딩 없이 동작 (`src/i18n.ts`).

- **리소스 위치**: `src/locales/{lang}/translation.json` (빌드 시 번들에 포함)
- **지원 언어**: en, ko, ja, es, sw, zh
- **로딩 방식**: `i18next.init({ resources: { ... } })` — HTTP 백엔드 미사용
- **언어 감지**: `i18next-browser-languagedetector` (localStorage `i18nextLng` 키 확인, 없으면 `CONFIG.defaultLang`)

이전에는 `public/locales/`에서 HTTP로 비동기 로딩했으나, 백그라운드 탭에서 번역 키가 노출되는 버그를 수정하기 위해 인라인 번들링으로 전환 (PR #78).

## Share Format

공유 텍스트 생성 (`src/lib/share.ts`):

- **Daily**: `Wor🔗dle yyyy-mm-dd N/6` (ISO 8601 날짜 포맷). URL에서 해시(`/#/`) 제거.
- **Custom**: `Wor🔗dle Custom/{questioner} N/6`. URL은 해시 포함 유지 (전체 경로 필요).
- **Calendar**: `Wor🔗dle yyyy-mm (🔥 streak)` + 요일 헤더 + 이모지 그리드. 현재 월일 때만 스트릭 표시.
- **URL 제외**: `excludeUrl` 설정이 켜져 있으면 공유 텍스트에서 URL 라인 생략.
- **이모지 그리드**: 🟩=correct, 🟪=present, ⬜=absent. box-drawing 문자로 체인 경로 표시 (`└`, `┐`, `┌`, `┘`).

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
- **v1.2.0** — Custom 퍼즐 출제/공유, Playwright E2E 테스트 인프라, 모드별 InfoModal 탭 UI, 후원 결제수단(KakaoPay/Toss), README 스크린샷 자동화, CI에 E2E 추가.
- **v1.3.0** — 월별 달력 (Daily 기록 시각화, 월 네비게이션, 이모지 공유), 주 시작 요일 설정 (일/월), 공유 시 URL 제외 설정, Daily 공유 날짜 ISO 8601 포맷, 공유 URL 해시 정리, Settings 모달 리팩토링 (섹션 제거), 번역 리소스 인라인 번들링 (백그라운드 탭 번역 키 노출 버그 수정), CI E2E 테스트 복원, 달력·공유 E2E 테스트.

## Communication

- 한국어로 소통.
