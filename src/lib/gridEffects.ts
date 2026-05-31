export type GridCell = {
  rowIndex: number
  colIndex: number
}

export type GridCellEffect = {
  actor?: string
  marker?: string
  value?: string
  hideLetter?: boolean
  hideStatus?: boolean
}

export type GridCellEffects = Record<string, GridCellEffect>

export type GridRowEffect = {
  prefix?: string
}

export type GridRowEffects = Record<number, GridRowEffect>

export const getGridCellKey = ({ rowIndex, colIndex }: GridCell) =>
  `${rowIndex}:${colIndex}`

export const mergeGridCellEffects = (
  ...sources: (GridCellEffects | undefined)[]
): GridCellEffects =>
  sources.reduce<GridCellEffects>((merged, source) => {
    if (!source) return merged
    Object.entries(source).forEach(([key, effect]) => {
      merged[key] = {
        ...merged[key],
        ...effect,
        hideLetter: merged[key]?.hideLetter || effect.hideLetter,
        hideStatus: merged[key]?.hideStatus || effect.hideStatus,
      }
    })
    return merged
  }, {})
