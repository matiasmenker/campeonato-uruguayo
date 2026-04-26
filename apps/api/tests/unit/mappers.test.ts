import { describe, it, expect } from "vitest"
import { toStandingContract } from "../../src/modules/standings/standings.mapper.js"
import { toPlayerContract } from "../../src/modules/players/players.mapper.js"

const isoDate = new Date("2026-01-15T00:00:00Z")

describe("toStandingContract — pure mapping (Objective 4)", () => {
  it("computes goalDifference as goalsFor minus goalsAgainst", () => {
    const standing = {
      id: 1,
      position: 1,
      points: 30,
      played: 12,
      won: 9,
      draw: 3,
      lost: 0,
      goalsFor: 25,
      goalsAgainst: 8,
      season: {
        id: 1,
        name: "2026",
        isCurrent: true,
        startingAt: isoDate,
        endingAt: isoDate,
      },
      stage: {
        id: 1,
        name: "Apertura",
        type: "league",
        isCurrent: true,
      },
      team: {
        id: 14,
        name: "Peñarol",
        shortCode: "PEÑ",
        imagePath: null,
      },
      createdAt: isoDate,
      updatedAt: isoDate,
    }

    const contract = toStandingContract(standing as never)
    expect(contract.goalDifference).toBe(17)
    expect(contract.team.name).toBe("Peñarol")
    expect(contract.stage?.name).toBe("Apertura")
  })

  it("emits a null stage when the standing is not attached to a stage", () => {
    const standing = {
      id: 2,
      position: 2,
      points: 20,
      played: 10,
      won: 6,
      draw: 2,
      lost: 2,
      goalsFor: 12,
      goalsAgainst: 8,
      season: {
        id: 1,
        name: "2026",
        isCurrent: true,
        startingAt: isoDate,
        endingAt: isoDate,
      },
      stage: null,
      team: {
        id: 15,
        name: "Nacional",
        shortCode: "NAC",
        imagePath: null,
      },
      createdAt: isoDate,
      updatedAt: isoDate,
    }

    const contract = toStandingContract(standing as never)
    expect(contract.stage).toBeNull()
  })
})

describe("toPlayerContract — null-safe mapping (Objective 1)", () => {
  it("emits null country when the player has no country relation", () => {
    const player = {
      id: 1622,
      sportmonksId: 999,
      name: "Test Player",
      commonName: null,
      firstName: null,
      lastName: null,
      displayName: null,
      imagePath: null,
      positionId: null,
      detailedPositionId: null,
      dateOfBirth: null,
      height: null,
      weight: null,
      gender: null,
      country: null,
      createdAt: isoDate,
      updatedAt: isoDate,
    }

    const contract = toPlayerContract(player as never)
    expect(contract.country).toBeNull()
    expect(contract.dateOfBirth).toBeNull()
    expect(contract.imagePath).toBeNull()
  })

  it("converts dateOfBirth to ISO when present and keeps country shape", () => {
    const player = {
      id: 1622,
      sportmonksId: 999,
      name: "Test Player",
      commonName: "T. Player",
      firstName: "Test",
      lastName: "Player",
      displayName: "T. Player",
      imagePath: "https://cdn.sportmonks.com/images/soccer/players/1/1622.png",
      positionId: 27,
      detailedPositionId: 151,
      dateOfBirth: new Date("1995-06-12T00:00:00Z"),
      height: 178,
      weight: 72,
      gender: "male",
      country: { id: 320, name: "Uruguay", imageUrl: null },
      createdAt: isoDate,
      updatedAt: isoDate,
    }

    const contract = toPlayerContract(player as never)
    expect(contract.dateOfBirth).toBe("1995-06-12T00:00:00.000Z")
    expect(contract.country).toEqual({ id: 320, name: "Uruguay", imageUrl: null })
  })
})
