const FALLBACK_API_BASE_URL = "http://localhost:3001"

const normalizeBaseUrl = (value: string) => {
  return value.endsWith("/") ? value : `${value}/`
}

const getApiBaseUrl = () => {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    FALLBACK_API_BASE_URL
  )
}

export const apiFetch = async <T>(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: HeadersInit } = {}
): Promise<T> => {
  const apiKey = process.env.API_KEY
  const url = new URL(
    path.replace(/^\//, ""),
    normalizeBaseUrl(getApiBaseUrl())
  )

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}
