import type { Stage } from "@/lib/seasons"

export type StageGroup = "apertura" | "intermedio" | "clausura"

export const STAGE_GROUP_ORDER: StageGroup[] = ["apertura", "intermedio", "clausura"]

export const STAGE_GROUP_LABELS: Record<StageGroup, string> = {
  apertura: "Apertura",
  intermedio: "Intermedio",
  clausura: "Clausura",
}

const STAGE_GROUP_PATTERNS: Record<StageGroup, RegExp> = {
  apertura: /^apertura$/i,
  clausura: /^clausura$/i,
  intermedio: /^intermediate round(\s*-\s*final)?$/i,
}

export const getStageGroup = (stageName: string | null | undefined): StageGroup | null => {
  if (!stageName) return null
  const trimmed = stageName.trim()
  for (const group of STAGE_GROUP_ORDER) {
    if (STAGE_GROUP_PATTERNS[group].test(trimmed)) return group
  }
  return null
}

export interface GroupedStages {
  group: StageGroup
  label: string
  stages: Stage[]
  primaryStageId: number | null
  isCurrent: boolean
}

export const groupStages = (stages: Stage[]): GroupedStages[] => {
  const buckets: Record<StageGroup, Stage[]> = { apertura: [], intermedio: [], clausura: [] }
  for (const stage of stages) {
    const group = getStageGroup(stage.name)
    if (group) buckets[group].push(stage)
  }
  return STAGE_GROUP_ORDER.map((group) => {
    const groupStagesList = buckets[group]
    const primary = groupStagesList.find((stage) => !/final/i.test(stage.name)) ?? groupStagesList[0] ?? null
    return {
      group,
      label: STAGE_GROUP_LABELS[group],
      stages: groupStagesList,
      primaryStageId: primary?.id ?? null,
      isCurrent: groupStagesList.some((stage) => stage.isCurrent),
    }
  })
}

export const getStagesForGroup = (stages: Stage[], group: StageGroup): Stage[] =>
  stages.filter((stage) => getStageGroup(stage.name) === group)

export const getStageGroupById = (stages: Stage[], stageId: number | null): StageGroup | null => {
  if (stageId == null) return null
  const stage = stages.find((candidate) => candidate.id === stageId)
  return stage ? getStageGroup(stage.name) : null
}

export const resolveGroupPrimaryStageId = (stages: Stage[], group: StageGroup): number | null => {
  const groupStagesList = getStagesForGroup(stages, group)
  const primary = groupStagesList.find((stage) => !/final/i.test(stage.name)) ?? groupStagesList[0] ?? null
  return primary?.id ?? null
}
