export type CustomPuzzle = {
  word: string
  questioner: string
}

function toUrlSafeBase64(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromUrlSafeBase64(urlSafe: string): string {
  let base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  return base64
}

export function encodeCustomPuzzle(
  word: string,
  questioner: string
): string {
  const utf8 = new TextEncoder().encode(`${word}_${questioner}`)
  const binary = Array.from(utf8, (b) => String.fromCharCode(b)).join('')
  return toUrlSafeBase64(btoa(binary))
}

export function decodeCustomPuzzle(code: string): CustomPuzzle | null {
  try {
    const binary = atob(fromUrlSafeBase64(code))
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const decoded = new TextDecoder().decode(bytes)
    const separatorIndex = decoded.indexOf('_')
    if (separatorIndex === -1) return null
    const word = decoded.substring(0, separatorIndex)
    const questioner = decoded.substring(separatorIndex + 1)
    if (!word || !questioner) return null
    return { word, questioner }
  } catch {
    return null
  }
}
