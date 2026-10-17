export function notificationTarget (data, accountId) {
  const roomId = Number(data?.room_id)
  return Number(data?.account_id) === accountId && Number.isSafeInteger(roomId) && roomId > 0 ? roomId : null
}
export function shouldNotifyChat (message, accountId, viewingRoomId, active) {
  return Boolean(message?.server_id && message.sender_id !== accountId && (!active || message.room_id !== viewingRoomId))
}
export function createChatNotifications (environment) {
  const { native, nativePushEnabled = true, local, push, app, storage, browser, registerDevice, unregisterDevice, onState } = environment
  let context = null, epoch = 0, handles = [], registration = null, pushToken = null
  let cleanup = Promise.resolve()
  let state = { enabled: false, permission: 'default', pushReady: false, error: '', supported: native || browser.supported }
  const emit = patch => {
    state = { ...state, ...patch }
    onState({ ...state })
  }
  const preferenceKey = account => `chat-notifications:${account}`
  const seenKey = account => `chat-notifications-seen:${account}`
  const safeRead = key => {
    try {
      return storage.getItem(key)
    } catch {
      return null
    }
  }
  const safeWrite = (key, value) => {
    try {
      storage.setItem(key, value)
    } catch { /* Storage may be restricted. */ }
  }
  let seen = new Set()
  function markSeen (key) {
    seen.add(key)
    seen = new Set([...seen].slice(-500))
    if (context) {
      safeWrite(seenKey(context.accountId), JSON.stringify([...seen]))
    }
  }
  function open (data) {
    if (!context) {
      return
    }
    const room = notificationTarget(data, context.accountId)
    if (room) {
      const messageId = Number(data.message_id)
      if (Number.isSafeInteger(messageId) && messageId > 0) {
        markSeen(context.accountId + ':' + messageId)
      }
      context.onOpen(room)
    }
  }
  async function listen (plugin, event, listener, expected) {
    const handle = await plugin.addListener(event, listener)
    if (expected === epoch) {
      handles.push(handle)
    } else {
      await handle.remove()
    }
  }
  async function rememberDeliveredPush () {
    if (!native || !context) {
      return
    }
    const expected = epoch, account = context.accountId
    try {
      const delivered = await push.getDeliveredNotifications()
      if (expected !== epoch) {
        return
      }
      for (const item of delivered.notifications) {
        const tag = /^chat-(\d+)-(\d+)-(\d+)$/.exec(item.tag || '')
        const owner = Number(item.data?.account_id || tag?.[1])
        const id = Number(item.data?.message_id || tag?.[3])
        if (owner === account && Number.isSafeInteger(id) && id > 0) {
          markSeen(account + ':' + id)
        }
      }
    } catch { /* Delivered notifications may be unavailable before the first registration. */ }
  }
  async function clearDelivered (accountId, roomId) {
    try {
      if (native) {
        const delivered = await local.getDeliveredNotifications()
        const notifications = delivered.notifications.filter(item => Number(item.extra?.account_id) === accountId && (!roomId || Number(item.extra?.room_id) === roomId))
        if (notifications.length > 0) {
          await local.removeDeliveredNotifications({ notifications })
        }
        const remote = await push.getDeliveredNotifications()
        const pushes = remote.notifications.filter(item =>
          (Number(item.data?.account_id) === accountId && (!roomId || Number(item.data?.room_id) === roomId))
          || item.tag?.startsWith(roomId ? 'chat-' + accountId + '-' + roomId + '-' : 'chat-' + accountId + '-'))
        if (pushes.length > 0) {
          await push.removeDeliveredNotifications({ notifications: pushes })
        }
      } else if (registration) {
        const delivered = await registration.getNotifications()
        for (const item of delivered) {
          if (Number(item.data?.account_id) === accountId && (!roomId || Number(item.data?.room_id) === roomId)) {
            item.close()
          }
        }
      }
    } catch { /* Clearing old notifications must not interrupt chat. */ }
  }
  async function detachDevice (oldContext) {
    if (!native || !oldContext) {
      return
    }
    const previousToken = pushToken
    pushToken = null
    await Promise.allSettled([
      unregisterDevice(oldContext.installationId, oldContext.token),
      ...(previousToken ? [push.unregister()] : []),
    ])
  }
  async function prepareDelivery (expected) {
    if (native) {
      await local.createChannel({ id: 'chat-messages', name: 'Chat messages', description: 'New group and individual chat messages', importance: 4, visibility: 0, vibration: true })
      if (expected !== epoch) {
        return
      }
      if (!nativePushEnabled) {
        emit({ pushReady: false, error: 'Local notifications are ready. Background alerts are not connected yet.' })
        return
      }
      try {
        await push.register()
      } catch {
        if (expected === epoch) {
          emit({ pushReady: false, error: 'Local notifications are ready. Background alerts are not connected yet.' })
        }
      }
    } else if (browser.registerWorker) {
      try {
        registration = await browser.registerWorker()
      } catch {
        registration = null
      }
    }
  }
  async function start (options) {
    const previous = context
    const oldHandles = handles
    handles = []
    context = null
    const expected = ++epoch
    cleanup = cleanup.then(async () => {
      await Promise.allSettled(oldHandles.map(handle => handle.remove()))
      await detachDevice(previous)
    })
    await cleanup
    if (expected !== epoch) {
      return
    }
    context = options
    seen = new Set()
    try {
      seen = new Set(JSON.parse(safeRead(seenKey(options.accountId)) || '[]'))
    } catch { /* Ignore invalid cache. */ }
    emit({ enabled: safeRead(preferenceKey(options.accountId)) === 'enabled', pushReady: false, error: '' })
    if (native) {
      await listen(app, 'appStateChange', event => {
        if (expected === epoch) {
          if (event.isActive) {
            void rememberDeliveredPush().finally(() => {
              if (expected === epoch) {
                options.onActive(true)
              }
            })
          } else {
            options.onActive(false)
          }
        }
      }, expected)
      const appState = await app.getState()
      if (expected !== epoch) {
        return
      }
      await rememberDeliveredPush()
      if (expected !== epoch) {
        return
      }
      options.onActive(appState.isActive)
      await listen(local, 'localNotificationActionPerformed', event => {
        if (expected === epoch) {
          open(event.notification.extra)
        }
      }, expected)
      await listen(push, 'pushNotificationActionPerformed', event => {
        if (expected === epoch) {
          open(event.notification.data)
        }
      }, expected)
      await listen(push, 'registration', async event => {
        if (expected !== epoch || !state.enabled) {
          return
        }
        pushToken = event.value
        try {
          const response = await registerDevice(options.installationId, event.value)
          if (expected === epoch) {
            emit({ pushReady: response.data.push_configured, error: response.data.push_configured ? '' : 'Local notifications are ready. Background alerts are not connected yet.' })
          }
        } catch {
          if (expected === epoch) {
            emit({ pushReady: false, error: 'Local notifications are ready. Unable to connect background alerts.' })
          }
        }
      }, expected)
      await listen(push, 'registrationError', () => {
        if (expected === epoch) {
          emit({ pushReady: false, error: 'Local notifications are ready. Background alerts are not connected yet.' })
        }
      }, expected)
      await listen(push, 'pushNotificationReceived', event => {
        if (expected !== epoch || !notificationTarget(event.data, options.accountId)) {
          return
        }
        const data = event.data
        options.onIncoming()
        void notify({ server_id: Number(data.message_id), room_id: Number(data.room_id), sender_id: Number(data.sender_id), sender: data.sender, text: data.text || event.body || '' }, { name: data.room_name, type: data.room_type })
      }, expected)
      const permission = await local.checkPermissions()
      if (expected !== epoch) {
        return
      }
      emit({ permission: permission.display, enabled: state.enabled && permission.display === 'granted' })
    } else {
      const permission = browser.permission()
      emit({ permission, enabled: state.enabled && permission === 'granted' })
      const remove = browser.onMessage?.(data => {
        if (expected === epoch && data?.type === 'chat-notification-open') {
          open(data)
        }
      })
      if (remove) {
        handles.push({ remove })
      }
    }
    if (state.enabled && state.permission === 'granted') {
      await prepareDelivery(expected)
    }
  }
  async function enable () {
    if (!context || !state.supported) {
      emit({ error: 'Notifications are not supported on this device or connection.' })
      return false
    }
    const expected = epoch
    // Browser permission requests happen immediately in the button's gesture handler.
    const permission = native ? (await local.requestPermissions()).display : await browser.requestPermission()
    if (expected !== epoch) {
      return false
    }
    emit({ permission, enabled: permission === 'granted', error: permission === 'granted' ? '' : 'Notifications are blocked. Allow them in your device or browser settings.' })
    if (permission !== 'granted') {
      return false
    }
    safeWrite(preferenceKey(context.accountId), 'enabled')
    await prepareDelivery(expected)
    return true
  }
  async function disable () {
    if (!context) {
      return
    }
    emit({ enabled: false, pushReady: false, error: '' })
    safeWrite(preferenceKey(context.accountId), 'disabled')
    await clearDelivered(context.accountId)
    await detachDevice(context)
  }
  async function notify (message, room) {
    const current = context, expected = epoch
    if (!current || !state.enabled || state.permission !== 'granted' || !shouldNotifyChat(message, current.accountId, current.viewingRoom(), current.isActive())) {
      return
    }
    if (native && state.pushReady) {
      await rememberDeliveredPush()
      if (expected !== epoch) {
        return
      }
    }
    const key = `${current.accountId}:${message.server_id}`
    if (seen.has(key)) {
      return
    }
    // Firebase displays background notification payloads itself
    // Avoid a second local alert.
    if (native && state.pushReady && !current.isActive()) {
      markSeen(key)
      return
    }
    const data = { type: 'chat', account_id: current.accountId, room_id: message.room_id, message_id: message.server_id }
    const title = room?.type === 'direct' ? message.sender : `${message.sender} · ${room?.name || 'Chat'}`
    markSeen(key)
    try {
      if (native) {
        await local.schedule({ notifications: [{ id: message.server_id, title, body: message.text.slice(0, 200), channelId: 'chat-messages', smallIcon: 'ic_chat_notification', autoCancel: true, extra: data }] })
      } else {
        const options = { body: message.text.slice(0, 200), tag: `chat-${key}`, icon: browser.icon, data: { ...data, url: browser.chatUrl(message.room_id, current.accountId) }, renotify: false }
        await (registration ? registration.showNotification(title, options) : browser.show(title, options, () => open(data)))
      }
      if (expected !== epoch) {
        await clearDelivered(current.accountId)
      }
    } catch {
      seen.delete(key)
      if (context?.accountId === current.accountId) {
        safeWrite(seenKey(current.accountId), JSON.stringify([...seen]))
      }
      if (expected === epoch) {
        emit({ error: 'Unable to show chat notifications. Check your notification settings.' })
      }
    }
  }
  function stop () {
    const previous = context, oldHandles = handles
    context = null
    handles = []
    epoch++
    emit({ enabled: false, pushReady: false, error: '' })
    cleanup = cleanup.then(async () => {
      await Promise.allSettled(oldHandles.map(handle => handle.remove()))
      if (previous) {
        await clearDelivered(previous.accountId)
      }
      await detachDevice(previous)
    })
    return cleanup
  }
  return { start, stop, enable, disable, notify, clearRoom: roomId => context ? clearDelivered(context.accountId, roomId) : Promise.resolve() }
}
