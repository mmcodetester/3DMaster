import Dexie from 'dexie'
import { io } from 'socket.io-client'
import { reactive } from 'vue'
import { clientMessageId, latestMessage, mergeMessage, messageKey, sortedMessages } from '@/utils/chat-messages'
import { getLoginInfo } from './auth.session'
import { createNotificationDelivery } from './chat.notifications'
import chatService from './chat.service'

// Every cache key belongs to the signed-in account. The old shared cache is never read.
const cache = new Dexie('ChatRoomsDatabase')
cache.version(1).stores({ rooms: '&key, account_id', messages: '&key, account_id, [account_id+room_id]' })
export const chat = reactive({
  rooms: [], users: [], messages: [], activeId: null, accountId: null,
  appActive: true, notificationsEnabled: false, notificationPermission: 'default', notificationSupported: false, notificationPushReady: false, notificationError: '', requestedRoomId: null,
  connected: false, loading: false, error: '', typing: '', typingPulse: 0, hasOlder: false, viewingRoomId: null,
})
let socket, interval, typingTimer, typingSentAt = 0, session = 0, syncing = false, syncRequested = false
let navigateToChat = () => {}
const notificationDelivery = createNotificationDelivery(state => {
  Object.assign(chat, { notificationsEnabled: state.enabled, notificationPermission: state.permission,
    notificationSupported: state.supported, notificationPushReady: state.pushReady, notificationError: state.error })
})
export function configureChatNavigation (handler) {
  navigateToChat = handler
}
export async function toggleChatNotifications () {
  try {
    await (chat.notificationsEnabled ? notificationDelivery.disable() : notificationDelivery.enable())
  } catch {
    chat.notificationError = 'Unable to enable notifications. Check your device settings.'
  }
}
function isChatActive () {
  return chat.appActive && !document.hidden && (document.hasFocus?.() ?? true)
}
function visibilityChanged () {
  chat.appActive = !document.hidden
  if (chat.appActive) {
    void syncChat()
  }
}
async function incomingMessage (message, account, expected = session) {
  if (expected !== session || account !== chat.accountId || message.sender_id === account) {
    return
  }
  const room = chat.rooms.find(item => item.id === message.room_id)
  if (room && (!isChatActive() || message.room_id !== chat.viewingRoomId)) {
    room.unread = (room.unread || 0) + 1
    await cache.rooms.update(room.key, { unread: room.unread })
  }
  if (expected === session) {
    await notificationDelivery.notify(message, room)
  }
}
const roomSyncs = new Map()
const roomKey = (id, account = chat.accountId) => `${account}:${id}`
const online = () => navigator.onLine !== false
function report (error) {
  chat.error = error.response?.data?.message || 'Unable to reach chat. Your queued messages are saved on this device.'
}
async function refreshMessages () {
  const account = chat.accountId, room = chat.activeId
  if (!account || !room) {
    chat.messages = []
    return
  }
  const rows = await cache.messages.where('[account_id+room_id]').equals([account, room]).toArray()
  if (account === chat.accountId && room === chat.activeId) {
    chat.messages = sortedMessages(rows)
  }
}
async function updatePreview (message, account) {
  const key = roomKey(message.room_id, account)
  let latest
  await cache.transaction('rw', cache.rooms, async () => {
    const stored = await cache.rooms.get(key)
    if (!stored) {
      return
    }
    latest = latestMessage(stored.last_message, message)
    await cache.rooms.update(key, { last_message: latest })
  })
  if (account === chat.accountId && latest) {
    const room = chat.rooms.find(item => item.id === message.room_id)
    if (room) {
      room.last_message = latest
    }
  }
}
async function saveMessage (message, account = chat.accountId) {
  let inserted = false
  const key = messageKey(account, message)
  await cache.transaction('rw', cache.messages, async () => {
    const existing = await cache.messages.get(key)
    inserted = !existing
    await cache.messages.put({ ...mergeMessage(existing, message), key, account_id: account })
  })
  await updatePreview(message, account)
  if (account === chat.accountId) {
    await refreshMessages()
  }
  return inserted
}
async function refreshRooms (expected = session) {
  const account = chat.accountId
  const [rooms, users] = await Promise.all([chatService.GetRooms(), chatService.GetUsers()])
  if (expected !== session) {
    return
  }
  const updated = rooms.data.map(room => ({ ...room, key: roomKey(room.id, account), account_id: account,
    last_message: latestMessage(chat.rooms.find(old => old.id === room.id)?.last_message, room.last_message),
    unread: chat.rooms.find(old => old.id === room.id)?.unread || 0,
    sync_cursor: chat.rooms.find(old => old.id === room.id)?.sync_cursor || 0 }))
  await cache.transaction('rw', cache.rooms, async () => {
    await cache.rooms.where('account_id').equals(account).delete()
    await cache.rooms.bulkPut(updated)
  })
  if (expected !== session) {
    return
  }
  chat.rooms = updated
  chat.users = users.data
  if (!chat.rooms.some(room => room.id === chat.activeId)) {
    chat.activeId = chat.rooms[0]?.id || null
  }
}
async function saveMessages (messages, account) {
  const fresh = []
  await cache.transaction('rw', cache.messages, async () => {
    for (const message of messages) {
      const key = messageKey(account, message)
      const existing = await cache.messages.get(key)
      if (!existing) {
        fresh.push(message)
      }
      await cache.messages.put({ ...mergeMessage(existing, message), key, account_id: account })
    }
  })
  const latestByRoom = new Map()
  for (const message of messages) {
    latestByRoom.set(message.room_id, latestMessage(latestByRoom.get(message.room_id), message))
  }
  for (const message of latestByRoom.values()) {
    await updatePreview(message, account)
  }
  if (account === chat.accountId) {
    await refreshMessages()
  }
  return fresh
}
async function syncRoom (roomId, expected = session) {
  const key = roomKey(roomId)
  if (roomSyncs.has(key)) {
    return roomSyncs.get(key)
  }
  const work = catchUpRoom(roomId, expected)
  roomSyncs.set(key, work)
  try {
    await work
  } finally {
    if (roomSyncs.get(key) === work) {
      roomSyncs.delete(key)
    }
  }
}
async function catchUpRoom (roomId, expected) {
  const account = chat.accountId
  const key = roomKey(roomId, account)
  const storedRoom = await cache.rooms.get(key)
  // Socket deliveries and send acknowledgements must never advance the catch-up cursor:
  // a later message may arrive before the missing messages from an offline period.
  let cursor = storedRoom?.sync_cursor || 0
  let more = true
  while (more && expected === session) {
    const response = await chatService.Get({ room_id: roomId, limit: 100, ...(cursor ? { cursor, direction: 'forward' } : {}) })
    if (expected !== session) {
      return
    }
    const received = response.data.messages
    const freshMessages = await saveMessages(received, account)
    if (cursor > 0) {
      for (const message of freshMessages) {
        await incomingMessage(message, account, expected)
      }
    }
    more = cursor > 0 && response.data.has_more && received.length > 0
    if (!cursor && roomId === chat.activeId) {
      chat.hasOlder = response.data.has_more
    }
    if (received.length > 0) {
      cursor = received.at(-1).server_id
      await cache.rooms.update(key, { sync_cursor: cursor })
      if (expected !== session) {
        return
      }
      const room = chat.rooms.find(item => item.id === roomId)
      if (room) {
        room.sync_cursor = cursor
      }
    }
  }
}
async function flush (expected = session) {
  const account = chat.accountId
  const pending = (await cache.messages.where('account_id').equals(account).toArray())
    .filter(message => message.syncStatus === 'pending')
    // Sort a fresh array for compatibility with older Android WebViews.
    // eslint-disable-next-line unicorn/no-array-sort
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  for (const message of pending) {
    if (expected !== session || !online()) {
      return
    }
    try {
      const response = await chatService.SendMessage({ room_id: message.room_id, text: message.text, client_id: message.client_id })
      await saveMessage(response.data, account)
    } catch (error) {
      if (expected !== session) {
        return
      }
      const status = error.response?.status
      if (status >= 400 && status < 500 && status !== 401 && status !== 429) {
        await cache.messages.update(message.key, { syncStatus: 'failed', failure: error.response?.data?.message || 'Message rejected.' })
        await updatePreview({ ...message, syncStatus: 'failed' }, account)
        await refreshMessages()
      } else {
        throw error
      }
    }
  }
}
export async function syncChat () {
  if (syncing) {
    syncRequested = true
    return
  }
  if (!chat.accountId || !online()) {
    return
  }
  const expected = session
  syncing = true
  try {
    await refreshRooms(expected)
    if (expected !== session) {
      return
    }
    await flush(expected)
    for (const room of chat.rooms) {
      if (expected !== session) {
        return
      }
      await syncRoom(room.id, expected)
    }
    if (expected === session) {
      chat.error = ''
    }
  } catch (error) {
    if (expected === session) {
      report(error)
    }
  } finally {
    if (expected === session) {
      syncing = false
      if (syncRequested) {
        syncRequested = false
        void syncChat()
      }
    }
  }
}
export async function startChat () {
  const login = getLoginInfo()
  if (!login || chat.accountId === Number(login.data.id)) {
    return
  }
  stopChat()
  const expected = session
  chat.accountId = Number(login.data.id)
  const rooms = await cache.rooms.where('account_id').equals(chat.accountId).toArray()
  if (expected !== session) {
    return
  }
  chat.rooms = rooms
  chat.activeId = rooms[0]?.id || null
  await refreshMessages()
  if (expected !== session) {
    return
  }
  socket = io(`${(import.meta.env.VITE_SOCKET_URL || window.location.origin).replace(/\/$/, '')}/chat`, {
    auth: { token: login.token }, transports: ['websocket', 'polling'],
  })
  socket.on('connect', () => {
    chat.connected = true
    void syncChat()
  })
  socket.on('disconnect', () => {
    chat.connected = false
    for (const user of chat.users) {
      user.online = false
    }
  })
  socket.on('connect_error', () => {
    chat.connected = false
  })
  socket.on('presence', ids => {
    const connected = new Set(ids)
    for (const user of chat.users) {
      user.online = connected.has(user.id)
    }
  })
  socket.on('rooms_changed', () => {
    void syncChat()
  })
  socket.on('message', async message => {
    if (expected !== session) {
      return
    }
    try {
      const account = chat.accountId
      if (!account) {
        return
      }
      const inserted = await saveMessage(message, account)
      if (account !== chat.accountId || expected !== session) {
        return
      }
      if (!chat.rooms.some(item => item.id === message.room_id)) {
        void syncChat()
      }
      if (inserted) {
        await incomingMessage(message, account, expected)
      }
    } catch (error) {
      report(error)
    }
  })
  socket.on('typing', data => {
    if (expected !== session || data.room_id !== chat.activeId || data.sender_id === chat.accountId) {
      return
    }
    chat.typing = `${data.sender} is typing…`
    chat.typingPulse++
    clearTimeout(typingTimer)
    typingTimer = setTimeout(() => {
      chat.typing = ''
    }, 2200)
  })
  let installationId = localStorage.getItem('chat-device-installation')
  if (!installationId) {
    installationId = clientMessageId()
    localStorage.setItem('chat-device-installation', installationId)
  }
  void notificationDelivery.start({ accountId: chat.accountId, token: login.token, installationId,
    viewingRoom: () => chat.viewingRoomId, isActive: isChatActive,
    onOpen: roomId => {
      if (expected !== session) {
        return
      }
      chat.requestedRoomId = roomId
      navigateToChat(roomId)
    },
    onIncoming: () => {
      if (expected === session) {
        void syncChat()
      }
    },
    onActive: active => {
      if (expected !== session) {
        return
      }
      chat.appActive = active
      if (active) {
        void syncChat()
      }
    },
  }).catch(() => {
    if (expected === session) {
      chat.notificationError = 'Unable to initialize notifications on this device.'
    }
  })
  document.addEventListener('visibilitychange', visibilityChanged)
  window.addEventListener('focus', visibilityChanged)
  window.addEventListener('online', syncChat)
  interval = setInterval(syncChat, 15_000)
  void syncChat()
}
export function stopChat () {
  session++
  socket?.removeAllListeners()
  socket?.disconnect()
  socket = null
  clearInterval(interval)
  clearTimeout(typingTimer)
  window.removeEventListener('online', syncChat)
  window.removeEventListener('focus', visibilityChanged)
  document.removeEventListener('visibilitychange', visibilityChanged)
  void notificationDelivery.stop()
  syncing = false
  syncRequested = false
  roomSyncs.clear()
  Object.assign(chat, { rooms: [], users: [], messages: [], activeId: null, accountId: null,
    appActive: true, notificationsEnabled: false, notificationPermission: 'default', notificationSupported: false, notificationPushReady: false, notificationError: '', requestedRoomId: null,
    connected: false, loading: false, error: '', typing: '', typingPulse: 0, hasOlder: false, viewingRoomId: null })
}
export async function selectRoom (id) {
  chat.activeId = id
  chat.typing = ''
  chat.hasOlder = true
  const room = chat.rooms.find(item => item.id === id)
  if (room) {
    room.unread = 0
    await cache.rooms.update(roomKey(id), { unread: 0 })
  }
  await refreshMessages()
  if (online()) {
    try {
      await syncRoom(id)
    } catch (error) {
      report(error)
    }
  }
}
export async function loadOlder () {
  if (chat.loading || !chat.activeId || !online()) {
    return
  }
  const room = chat.activeId, account = chat.accountId
  const ids = chat.messages.filter(message => message.server_id).map(message => message.server_id)
  chat.loading = true
  try {
    const response = await chatService.Get({ room_id: room, limit: 40, ...(ids.length > 0 ? { cursor: Math.min(...ids) } : {}) })
    if (account !== chat.accountId) {
      return
    }
    await saveMessages(response.data.messages, account)
    if (room === chat.activeId) {
      chat.hasOlder = response.data.has_more
    }
  } catch (error) {
    report(error)
  } finally {
    chat.loading = false
  }
}
export async function createRoom (input) {
  const response = await chatService.CreateRoom(input)
  await refreshRooms()
  await selectRoom(response.data.id)
  return response.data
}
export async function sendMessage (text) {
  const login = getLoginInfo()
  if (!login || !chat.activeId || !text.trim() || text.trim().length > 4000) {
    return
  }
  await saveMessage({ room_id: chat.activeId, sender_id: chat.accountId, sender: login.data.name,
    client_id: clientMessageId(), text: text.trim(), date: new Date().toISOString(), syncStatus: 'pending' })
  void syncChat()
}
export async function retryMessage (message) {
  await cache.messages.update(message.key, { syncStatus: 'pending', failure: null })
  await updatePreview({ ...message, syncStatus: 'pending', failure: null }, chat.accountId)
  await refreshMessages()
  void syncChat()
}
export function sendTyping () {
  if (!chat.connected || !chat.activeId || Date.now() - typingSentAt < 1200) {
    return
  }
  typingSentAt = Date.now()
  chatService.SendTypingEvent(chat.activeId).catch(() => {})
}

export async function setViewingRoom (id) {
  chat.viewingRoomId = id
  if (id && isChatActive()) {
    void notificationDelivery.clearRoom(id)
  }
  if (!id) {
    return
  }
  const room = chat.rooms.find(item => item.id === id)
  if (room) {
    room.unread = 0
    await cache.rooms.update(roomKey(id), { unread: 0 })
  }
}
