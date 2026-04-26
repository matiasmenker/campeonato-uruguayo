export interface FormationCell {
  row: number
  col: number
}

export const parseFormationField = (formationField: string): FormationCell => {
  const [rowStr, colStr] = formationField.split(":")
  return {
    row: parseInt(rowStr ?? "0", 10),
    col: parseInt(colStr ?? "0", 10),
  }
}

export const parseFormationRows = (formation: string | null | undefined): number[] => {
  if (!formation) return []
  return formation
    .split("-")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0)
}
