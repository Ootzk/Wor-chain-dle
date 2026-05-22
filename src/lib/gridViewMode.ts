export type GridViewMode = 'live' | 'spoilerFree' | 'reveal'

export const cycleGridViewMode = (
  current: GridViewMode,
  availableModes: GridViewMode[]
): GridViewMode => {
  if (availableModes.length === 0) return current

  const currentIndex = availableModes.indexOf(current)
  if (currentIndex < 0) return availableModes[0]

  return availableModes[(currentIndex + 1) % availableModes.length]
}
