export const messageKey = (accountId, message) => `${accountId}:${message.sender_id}:${message.client_id}`
function plainMessage (message) {
  if (!message) {
    return message
  }
  return { ...message, ...(message.reply_to ? { reply_to: { ...message.reply_to } } : {}),
    ...(message.attachment ? { attachment: { ...message.attachment } } : {}) }
}
export function mergeMessage (existing, incoming) {
  return { ...plainMessage(existing), ...plainMessage(incoming), syncStatus: incoming.server_id ? 'synced' : (existing?.syncStatus || 'pending') }
}
export function sortedMessages (messages) {
  // Sort a copy for older Android WebViews that do not provide Array.toSorted.
  // eslint-disable-next-line unicorn/no-array-sort
  return [...messages].sort((a, b) => {
    if (a.server_id && b.server_id) {
      return a.server_id - b.server_id
    }
    if (a.server_id) {
      return -1
    }
    if (b.server_id) {
      return 1
    }
    return new Date(a.date) - new Date(b.date)
  })
}
export function clientMessageId () {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function previewMessage (message) {
  const preview = plainMessage(message)
  if (preview) {
    delete preview.file_blob
    delete preview.file_name
    delete preview.uploadProgress
  }
  return preview
}
export function latestMessage (current, incoming) {
  if (!current) {
    return incoming ? previewMessage(incoming) : null
  }
  if (!incoming) {
    return previewMessage(current)
  }
  if (current.client_id && current.sender_id === incoming.sender_id && current.client_id === incoming.client_id) {
    return previewMessage(mergeMessage(current, incoming))
  }
  if (!current.server_id && incoming.server_id) {
    return previewMessage(current)
  }
  if (current.server_id && !incoming.server_id) {
    return previewMessage(incoming)
  }
  if (current.server_id && incoming.server_id) {
    return previewMessage(incoming.server_id > current.server_id ? incoming : current)
  }
  return previewMessage(new Date(incoming.date) >= new Date(current.date) ? incoming : current)
}
export function conversationOnline (room, users, connected, accountId) {
  if (!connected) {
    return false
  }
  return users.some(user => user.id !== accountId && user.online
    && (room.type === 'general' || room.members.some(member => member.id === user.id)))
}
export function conversationPreview (message, accountId, roomType) {
  if (!message) {
    return 'No messages yet'
  }
  const status = message.syncStatus === 'pending' ? 'Queued · ' : (message.syncStatus === 'failed' ? 'Not sent · ' : '')
  const sender = message.sender_id === accountId ? 'You: ' : (roomType === 'direct' ? '' : `${message.sender || 'Deleted user'}: `)
  return `${status}${sender}${(message.text || (message.attachment ? 'Attachment: ' + message.attachment.name : '')).replace(/\s+/g, ' ').trim()}`
}
