# Wor-chain-dle — Development Guide

Wordle meets word chain — your next guess must start with the last letter of your previous one.

Based on [AnyLanguage-Word-Guessing-Game](https://github.com/roedoejet/AnyLanguage-Word-Guessing-Game) fork.

## Tech Stack

- React 17 + TypeScript + Tailwind CSS 3
- Create React App (react-scripts 5)
- i18next (en, es, sw, zh)
- GitHub Actions → GitHub Pages 자동 배포

## Project Structure

```text
src/
  App.tsx                        ← 게임 메인 로직 (onChar, onDelete, onEnter)
  constants/
    config.ts                    ← 게임 설정 (tries, wordLength, language 등)
    orthography.ts               ← 문자 체계 (키보드 레이아웃)
    wordlist.ts                  ← 정답 단어 목록
    validGuesses.ts              ← 유효 추측 단어 목록
  lib/
    words.ts                     ← 오늘의 단어 선택, 단어 검증
    statuses.ts                  ← 글자 상태 판정 (correct/present/absent)
    tokenizer.ts                 ← orthography 기반 단어 토큰화
  components/
    grid/                        ← 게임 그리드 UI
    keyboard/                    ← 키보드 UI
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

## Version History

- **v0.1.0** — AnyLanguage-Wordle 포크 초기 세팅. 기본 색상 변경 (purple/orange).
- **v0.2.0** — 문서 정비, 영어 Wordle 기본 구현.

## Communication

- 한국어로 소통.
