/**
 * Normalize a YouTube URL to embed format for iframe src.
 * Accepts: watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
export function toYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // Already embed
  if (/youtube\.com\/embed\/[a-zA-Z0-9_-]+/.test(trimmed)) return trimmed

  // youtube.com/watch?v=ID or youtube.com/v/ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`

  // If it looks like a full URL but we didn't match, return as-is (might be another host)
  if (trimmed.startsWith('http')) return trimmed
  return null
}
