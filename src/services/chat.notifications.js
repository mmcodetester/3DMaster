import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { PushNotifications } from '@capacitor/push-notifications'
import { createChatNotifications } from '@/utils/chat-notifications'
import chatService from './chat.service'
const base = import.meta.env.BASE_URL || '/'
async function registerNotificationWorker () {
  const registration = await navigator.serviceWorker.register(`${base}chat-notification-sw.js`, { scope: `${base}chat-notifications/` })
  if (registration.active) {
    return registration
  }
  const worker = registration.installing || registration.waiting
  if (!worker) {
    throw new Error('Notification worker is unavailable.')
  }
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.removeEventListener('statechange', changed)
      reject(new Error('Notification worker activation timed out.'))
    }, 10_000)
    function changed () {
      if (worker.state === 'activated' || worker.state === 'redundant') {
        clearTimeout(timeout)
        worker.removeEventListener('statechange', changed)
        if (worker.state === 'activated') {
          resolve()
        } else {
          reject(new Error('Notification worker activation failed.'))
        }
      }
    }
    worker.addEventListener('statechange', changed)
    changed()
  })
  return registration
}
export function createNotificationDelivery (onState) {
  return createChatNotifications({
    native: Capacitor.isNativePlatform(), nativePushEnabled: import.meta.env.VITE_CHAT_PUSH_CONFIGURED === true, local: LocalNotifications, push: PushNotifications, app: App,
    storage: localStorage, onState,
    registerDevice: (installationId, token) => chatService.RegisterDevice({ installation_id: installationId, token }),
    unregisterDevice: (installationId, token) => chatService.UnregisterDevice(installationId, token),
    browser: {
      supported: window.isSecureContext && typeof Notification !== 'undefined',
      permission: () => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
      requestPermission: () => Notification.requestPermission(),
      icon: `${base}logo.jpg`,
      chatUrl: (roomId, accountId) => new URL(`${base}live-chat?room=${roomId}&chat_account=${accountId}`, window.location.origin).href,
      registerWorker: 'serviceWorker' in navigator ? registerNotificationWorker : null,
      onMessage: handler => {
        const listener = event => handler(event.data)
        navigator.serviceWorker?.addEventListener('message', listener)
        return () => navigator.serviceWorker?.removeEventListener('message', listener)
      },
      show: (title, options, open) => {
        const notification = new Notification(title, options)
        notification.addEventListener('click', () => {
          notification.close()
          window.focus()
          open()
        })
      },
    },
  })
}
