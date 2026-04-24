import type { YoutubeVideo } from "@/components/youtube-video-card"

const INCLUDE_KEYWORDS = ["apertura", "clausura"]

const EXCLUDE_KEYWORDS = ["segunda profesional", "sub-", "selección", "femenin"]

const shouldInclude = (title: string) => {
  const lower = title.toLowerCase()
  const hasTarget = INCLUDE_KEYWORDS.some((keyword) => lower.includes(keyword))
  const isExcluded = EXCLUDE_KEYWORDS.some((keyword) => lower.includes(keyword))
  return hasTarget && !isExcluded
}

interface YoutubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    publishedAt: string
    thumbnails: {
      high?: { url: string }
      medium?: { url: string }
      default?: { url: string }
    }
  }
}

interface YoutubeSearchResponse {
  items: YoutubeSearchItem[]
}

export const fetchLatestAufVideos = async (maxResults = 6): Promise<YoutubeVideo[]> => {
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID

  if (!apiKey || !channelId) {
    return []
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search")
  url.searchParams.set("part", "snippet")
  url.searchParams.set("channelId", channelId)
  url.searchParams.set("type", "video")
  url.searchParams.set("order", "date")
  url.searchParams.set("maxResults", String(maxResults + 10))
  url.searchParams.set("key", apiKey)

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`YouTube API request failed with status ${response.status}`)
  }

  const data = (await response.json()) as YoutubeSearchResponse

  return data.items
    .filter((item) => shouldInclude(item.snippet.title))
    .slice(0, maxResults)
    .map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
      publishedAt: item.snippet.publishedAt,
    }))
}
