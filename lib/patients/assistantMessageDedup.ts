type ChatMessageLike = {
  sender: 'assistant' | 'user'
  text: string
}

const normalizeAssistantMessage = (value: string): string =>
  value
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

export function shouldSkipDuplicateAssistantMessage(params: {
  messages: ChatMessageLike[]
  nextText: string
}): boolean {
  const normalizedNext = normalizeAssistantMessage(params.nextText)
  if (!normalizedNext) {
    return true
  }

  const lastMessage = params.messages.at(-1)
  if (!lastMessage || lastMessage.sender !== 'assistant') {
    return false
  }

  return normalizeAssistantMessage(lastMessage.text) === normalizedNext
}
