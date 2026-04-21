/** Official SportMonks placeholder used when a player has no photo. */
export const PLAYER_PLACEHOLDER_URL = "https://cdn.sportmonks.com/images/soccer/placeholder.png"

/**
 * Returns the player image URL, falling back to the SportMonks placeholder
 * when the path is null, empty, or already points to a placeholder.
 */
export const resolvePlayerImageUrl = (imagePath: string | null | undefined): string =>
  imagePath && !imagePath.includes("placeholder") ? imagePath : PLAYER_PLACEHOLDER_URL
