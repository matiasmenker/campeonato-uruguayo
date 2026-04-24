
export const PLAYER_PLACEHOLDER_URL = "https://cdn.sportmonks.com/images/soccer/placeholder.png"

export const resolvePlayerImageUrl = (imagePath: string | null | undefined): string =>
  imagePath && !imagePath.includes("placeholder") ? imagePath : PLAYER_PLACEHOLDER_URL
