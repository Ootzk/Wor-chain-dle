export type ChainInfo = { letter: string; position: 'first' | 'last' }

export function getChainInfo(guesses: string[][]): ChainInfo | null {
  if (guesses.length === 0) return null
  const prev = guesses[guesses.length - 1]
  if (guesses.length % 2 === 1) {
    // 1→2, 3→4, 5→6: 끝 글자 체인 (오른쪽)
    return { letter: prev[prev.length - 1], position: 'last' }
  } else {
    // 2→3, 4→5: 첫 글자 체인 (왼쪽)
    return { letter: prev[0], position: 'first' }
  }
}
