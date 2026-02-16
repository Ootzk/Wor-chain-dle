# Wor-chain-dle — Development Guide

Wordle meets word chain — guess the word while chaining letters in a snake pattern.

Based on [AnyLanguage-Word-Guessing-Game](https://github.com/roedoejet/AnyLanguage-Word-Guessing-Game) fork.

## Tech Stack

- React 17 + TypeScript + Tailwind CSS 3
- Create React App (react-scripts 5)
- i18next (en, es, sw, zh)
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
    tokenizer.ts                 ← orthography 기반 단어 토큰화
  components/
    grid/                        ← 게임 그리드 UI (green=correct, purple=present, ChainBridge)
    keyboard/                    ← QWERTY 키보드 UI + 물리 키보드 지원 (e.code 기반, IME 호환)
    modals/                      ← Info, Stats, About, Translate 모달
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

## Git Branching Strategy

- `main`: 항상 배포 가능한 상태. 머지될 때마다 버전 태그 등록.
- `release/{version}`: 다음 버전 개발 브랜치. main에서 생성. 해당 버전이 어느 정도 완성되면 main으로 PR을 보내서 머지.
- `feature/{contents}`: 기능별 브랜치. release 브랜치에서 생성. 작업 완료 후 release 브랜치로 PR을 만들어서 머지.
- **PR 머지는 항상 개발자가 직접 수행.** Claude는 PR 생성까지만.

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

## Communication

- 한국어로 소통.
