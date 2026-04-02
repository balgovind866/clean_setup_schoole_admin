/**
 * Robust array extractor for API responses.
 *
 * Handles ALL common backend response shapes:
 *   - data.data = []                          (direct array)
 *   - data.data = { categories: [...] }       (nested key)
 *   - data.data = { items: [...] }
 *   - data.data = { payments: [...] }
 *   etc.
 *
 * @param raw   The value of `response.data.data`
 * @param hints Keys to check first before scanning all keys
 */
export function extractArray(raw: any, ...hints: string[]): any[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') {
    // Try hint keys first (more specific, faster)
    for (const key of hints) {
      if (Array.isArray(raw[key])) return raw[key]
    }
    // Fall back: scan any key that is an array
    for (const key of Object.keys(raw)) {
      if (Array.isArray(raw[key])) return raw[key]
    }
  }
  return []
}

/**
 * Extract a detailed error message from an Axios error.
 */
export function extractError(e: any, fallback = 'Request failed'): string {
  const status = e?.response?.status
  const msg =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.response?.statusText ||
    e?.message ||
    fallback
  return status ? `${msg} (HTTP ${status})` : msg
}
