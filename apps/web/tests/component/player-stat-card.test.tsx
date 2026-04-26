import React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatCard, RatingStatCard } from "@/components/player-stat-card"
import { DASH } from "@/lib/display"

describe("StatCard — Objective 1 (missing values render as dash, never zero)", () => {
  it("renders the dash when hasData is false", () => {
    render(<StatCard label="Goals" value={null} icon={null} hasData={false} />)
    const card = screen.getByTestId("stat-card")
    expect(card).toHaveAttribute("data-has-data", "false")
    expect(card.textContent).toContain(DASH)
    expect(card.textContent).not.toContain("0")
  })

  it("renders the dash when hasData is true but value is null", () => {
    render(<StatCard label="Goals" value={null} icon={null} hasData={true} />)
    expect(screen.getByTestId("stat-card").textContent).toContain(DASH)
  })

  it("renders the recorded value when hasData and value is a real zero", () => {
    render(<StatCard label="Goals" value={0} icon={null} hasData={true} />)
    const card = screen.getByTestId("stat-card")
    expect(card).toHaveAttribute("data-has-data", "true")
    expect(card.textContent).toContain("0")
    expect(card.textContent).not.toContain(DASH)
  })

  it("renders a positive integer value", () => {
    render(<StatCard label="Goals" value={7} icon={null} hasData={true} />)
    expect(screen.getByTestId("stat-card").textContent).toContain("7")
  })
})

describe("RatingStatCard — Objective 5 (rating null → dash, never 0.00)", () => {
  it("renders the dash when avgRating is null", () => {
    render(<RatingStatCard avgRating={null} hasData={false} />)
    const card = screen.getByTestId("rating-stat-card")
    expect(card).toHaveAttribute("data-has-data", "false")
    expect(card.textContent).toContain(DASH)
    expect(card.textContent).not.toContain("0.00")
  })

  it("renders the dash when hasData is true but avgRating is null — never fabricates 0.00", () => {
    render(<RatingStatCard avgRating={null} hasData={true} />)
    const card = screen.getByTestId("rating-stat-card")
    expect(card).toHaveAttribute("data-has-data", "false")
    expect(card.textContent).toContain(DASH)
    expect(card.textContent).not.toContain("0.00")
  })

  it("renders the rating to 2 decimals when present", () => {
    render(<RatingStatCard avgRating={7.42} hasData={true} />)
    const card = screen.getByTestId("rating-stat-card")
    expect(card).toHaveAttribute("data-has-data", "true")
    expect(card.textContent).toContain("7.42")
  })

  it("pads single-decimal ratings to 2 decimals", () => {
    render(<RatingStatCard avgRating={8} hasData={true} />)
    expect(screen.getByTestId("rating-stat-card").textContent).toContain("8.00")
  })
})
