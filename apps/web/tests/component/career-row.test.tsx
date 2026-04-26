import React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { buildCareerRowDisplay, DASH } from "@/lib/display"

const CareerRow = ({
  seasonName,
  aggregates,
}: {
  seasonName: string
  aggregates: Parameters<typeof buildCareerRowDisplay>[0]
}) => {
  const row = buildCareerRowDisplay(aggregates)
  return (
    <div data-testid="career-row" data-season={seasonName} data-has-played={String(row.hasPlayed)}>
      <span data-testid="cell-appearances">{row.appearances}</span>
      <span data-testid="cell-goals">{row.goals}</span>
      <span data-testid="cell-assists">{row.assists}</span>
      <span data-testid="cell-minutes">{row.minutes}</span>
      <span data-testid="cell-yellows">{row.yellowCards}</span>
      <span data-testid="cell-reds">{row.redCards}</span>
      <span data-testid="cell-saves">{row.saves}</span>
      <span data-testid="cell-contributions">{row.goalContributions}</span>
      <span data-testid="cell-rating">{row.avgRating}</span>
    </div>
  )
}

describe("Career row — Objective 6 (multi-season comparison renders descriptive cells)", () => {
  it("renders a dash in every numeric cell when the season has no aggregates (player did not play)", () => {
    render(<CareerRow seasonName="Apertura 2024" aggregates={null} />)
    const row = screen.getByTestId("career-row")
    expect(row).toHaveAttribute("data-has-played", "false")
    expect(screen.getByTestId("cell-appearances").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-goals").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-assists").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-minutes").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-yellows").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-reds").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-saves").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-contributions").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-rating").textContent).toBe(DASH)
  })

  it("renders dashes (never zeros) when aggregates exist but appearances is 0", () => {
    render(
      <CareerRow
        seasonName="Clausura 2024"
        aggregates={{
          appearances: 0,
          avgRating: null,
          totalMinutes: null,
          goals: 0,
          assists: 0,
          saves: 0,
          yellowCards: 0,
          redCards: 0,
        }}
      />,
    )
    expect(screen.getByTestId("career-row")).toHaveAttribute("data-has-played", "false")
    expect(screen.getByTestId("cell-rating").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-rating").textContent).not.toBe("0.00")
    expect(screen.getByTestId("cell-minutes").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-minutes").textContent).not.toBe("0")
  })

  it("renders populated values when the player participated in the season", () => {
    render(
      <CareerRow
        seasonName="Apertura 2025"
        aggregates={{
          appearances: 18,
          avgRating: 7.42,
          totalMinutes: 1530,
          goals: 5,
          assists: 3,
          saves: 0,
          yellowCards: 4,
          redCards: 1,
        }}
      />,
    )
    expect(screen.getByTestId("career-row")).toHaveAttribute("data-has-played", "true")
    expect(screen.getByTestId("cell-appearances").textContent).toBe("18")
    expect(screen.getByTestId("cell-goals").textContent).toBe("5")
    expect(screen.getByTestId("cell-assists").textContent).toBe("3")
    expect(screen.getByTestId("cell-minutes").textContent).toBe("1,530")
    expect(screen.getByTestId("cell-yellows").textContent).toBe("4")
    expect(screen.getByTestId("cell-reds").textContent).toBe("1")
    expect(screen.getByTestId("cell-saves").textContent).toBe("0")
    expect(screen.getByTestId("cell-contributions").textContent).toBe("8")
    expect(screen.getByTestId("cell-rating").textContent).toBe("7.42")
  })

  it("renders a dash for avgRating when the player played but no rating data exists — never 0.00", () => {
    render(
      <CareerRow
        seasonName="Clausura 2025"
        aggregates={{
          appearances: 5,
          avgRating: null,
          totalMinutes: 450,
          goals: 0,
          assists: 0,
          saves: 0,
          yellowCards: 0,
          redCards: 0,
        }}
      />,
    )
    expect(screen.getByTestId("cell-rating").textContent).toBe(DASH)
    expect(screen.getByTestId("cell-rating").textContent).not.toBe("0.00")
  })

  it("renders side-by-side rows for two seasons, mixing real values with dashes", () => {
    render(
      <div>
        <CareerRow
          seasonName="Apertura 2024"
          aggregates={{
            appearances: 12,
            avgRating: 7.1,
            totalMinutes: 980,
            goals: 2,
            assists: 1,
            saves: 0,
            yellowCards: 2,
            redCards: 0,
          }}
        />
        <CareerRow seasonName="Clausura 2024" aggregates={null} />
      </div>,
    )
    const rows = screen.getAllByTestId("career-row")
    expect(rows[0]).toHaveAttribute("data-has-played", "true")
    expect(rows[1]).toHaveAttribute("data-has-played", "false")
    expect(rows[0].textContent).toContain("7.10")
    expect(rows[1].textContent).toContain(DASH)
  })
})
