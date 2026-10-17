import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import Dexie from 'dexie'
import { getLoginInfo } from './auth.session'
import chatService from './chat.service'
const cache = new Dexie('PrivateChatAttachments')
cache.version(1).stores({ files: '&key, account_id, saved_at' })
export async function attachmentBlob (attachment, localFile) {
  const account = Number(getLoginInfo()?.data.id)
  if (!account) {
    throw new Error('Sign in to open attachments.')
  }
  if (localFile) {
    return localFile
  }
  const key = `${account}:${attachment.id}`
  try {
    const stored = await cache.files.get(key)
    if (stored) {
      return stored.blob
    }
  } catch { /* Downloads remain available if attachment caching is blocked. */ }
  const response = await chatService.Download(attachment.id)
  if (Number(getLoginInfo()?.data.id) !== account) {
    throw new Error('Account changed.')
  }
  const blob = new Blob([response.data], { type: attachment.mime })
  try {
    const rows = await cache.files.where('account_id').equals(account).toArray()
    let size = rows.reduce((sum, row) => sum + row.blob.size, 0)
    // eslint-disable-next-line unicorn/no-array-sort
    for (const row of rows.sort((a, b) => a.saved_at - b.saved_at)) {
      if (size + blob.size <= 50 * 1024 * 1024) {
        break
      }
      await cache.files.delete(row.key)
      size -= row.blob.size
    }
    await cache.files.put({ key, account_id: account, blob, saved_at: Date.now() })
  } catch { /* A full cache must not prevent opening a received file. */ }
  return blob
}
export async function openAttachment (attachment, localFile) {
  const account = Number(getLoginInfo()?.data.id)
  const blob = await attachmentBlob(attachment, localFile)
  if (Number(getLoginInfo()?.data.id) !== account) {
    throw new Error('Account changed.')
  }
  if (Capacitor.isNativePlatform()) {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => resolve(String(reader.result).split(',')[1]))
      reader.addEventListener('error', reject, { once: true })
      reader.readAsDataURL(blob)
    })
    const name = Array.from(attachment.name).filter(character => character.codePointAt(0) >= 32 && character.codePointAt(0) !== 127).join('').replace(/[\\/:*?"<>|]/g, '_').slice(-120)
    const file = await Filesystem.writeFile({ path: `chat-${attachment.id || Date.now()}-${name}`, data, directory: Directory.Cache })
    await Share.share({ title: attachment.name, files: [file.uri] })
  } else {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = attachment.name
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }
}
