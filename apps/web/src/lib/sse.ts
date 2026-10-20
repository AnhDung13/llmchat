// Đọc Server-Sent Events từ một Response của fetch().
// Không dùng EventSource vì EventSource chỉ gửi được GET và không gắn được header Authorization.

export type SseEvent = { event: string; data: string }

export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, '\n')
      // Mỗi event kết thúc bằng một dòng trống
      let sep = buffer.indexOf('\n\n')
      while (sep !== -1) {
        const parsed = parseBlock(buffer.slice(0, sep))
        buffer = buffer.slice(sep + 2)
        if (parsed) yield parsed
        sep = buffer.indexOf('\n\n')
      }
    }
    const rest = parseBlock(buffer + decoder.decode())
    if (rest) yield rest
  } finally {
    reader.releaseLock()
  }
}

function parseBlock(block: string): SseEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (line === '' || line.startsWith(':')) continue // dòng trống hoặc comment (heartbeat)
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    let value = colon === -1 ? '' : line.slice(colon + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  if (data.length === 0) return null
  return { event, data: data.join('\n') }
}
