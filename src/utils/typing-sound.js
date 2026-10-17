export function createTypingSound ({ native = false, nativeAudio, createAudio, url, now = Date.now }) {
  const assetId = 'chat_typing_sound'
  let audio, ready, disposed = false, lastPlayed = -Infinity, unlocked = false
  function initialize () {
    if (ready) {
      return ready
    }
    ready = (async () => {
      if (native) {
        await nativeAudio.preload({ assetId, assetPath: 'typing.mp3', audioChannelNum: 1, isUrl: false })
      } else {
        audio = createAudio(url)
        audio.preload = 'auto'
        audio.load()
      }
    })().catch(() => {
      ready = null
    })
    return ready
  }
  // Called directly from a pointer/key gesture to satisfy browser autoplay rules.
  async function unlock () {
    if (native || disposed || unlocked || !audio) {
      return
    }
    audio.volume = 0
    try {
      await audio.play()
      audio.pause()
      audio.currentTime = 0
      unlocked = true
    } catch {
      // Keep listening for the next gesture if the browser still blocks playback.
    } finally {
      audio.volume = 1
    }
  }
  async function play () {
    if (disposed || now() - lastPlayed < 1200) {
      return
    }
    lastPlayed = now()
    await initialize()
    if (disposed) {
      return
    }
    try {
      if (native) {
        await nativeAudio.play({ assetId })
      } else if (audio) {
        audio.currentTime = 0
        await audio.play()
      }
    } catch {
      // Autoplay denial must not interrupt chat or create an unhandled rejection.
    }
  }
  async function dispose () {
    disposed = true
    await ready
    if (native && ready) {
      try {
        await nativeAudio.unload({ assetId })
      } catch { /* Already released. */ }
    } else if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  }
  return { initialize, unlock, play, dispose }
}
