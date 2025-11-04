/**
 * 仅处理不带协议的域名型 URL，例如:
 *   xy-oss.aliyuncs.com/path => https://xy-oss.aliyuncs.com/path
 * 其余情况原样返回（包含已带 http/https 的情况）。
 */
export function toAbsoluteUrl(input?: string): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(\/|$)/i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}
