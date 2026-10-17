self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data || {}
  if (data.type !== 'chat' || !Number.isSafeInteger(Number(data.room_id))) {
    return
  }
  event.waitUntil((async () => {
    const url = new URL(data.url, self.location.origin)
    if (url.origin !== self.location.origin) {
      return
    }
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const target = windows.find(client => new URL(client.url).origin === self.location.origin)
    if (target) {
      target.postMessage({ ...data, type: 'chat-notification-open' })
      await target.focus()
    } else {
      await self.clients.openWindow(url.href)
    }
  })())
})
