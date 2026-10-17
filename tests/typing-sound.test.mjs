import test from 'node:test'
import assert from 'node:assert/strict'
import { createTypingSound } from '../src/utils/typing-sound.js'
test('browser sound unlocks on a gesture, throttles repeats, and releases audio on leaving chat', async () => {
  let time=0, plays=0, pauses=0, removed=false
  const audio={volume:1,currentTime:0,load(){},async play(){plays++},pause(){pauses++},removeAttribute(){removed=true}}
  const sound=createTypingSound({createAudio:()=>audio,url:'/typing.mp3',now:()=>time})
  await sound.initialize();await sound.unlock()
  assert.equal(audio.volume,1)
  assert.equal(pauses,1)
  await sound.play();await sound.play()
  assert.equal(plays,2)
  time=1300;await sound.play()
  assert.equal(plays,3)
  await sound.dispose();time=3000;await sound.play()
  assert.equal(plays,3)
  assert.equal(removed,true)
})
test('browser autoplay rejection is recoverable on a later gesture',async()=>{
  let blocked=true,plays=0
  const audio={volume:1,currentTime:0,load(){},async play(){if(blocked)throw new Error('NotAllowedError');plays++},pause(){},removeAttribute(){}}
  const sound=createTypingSound({createAudio:()=>audio,url:'/typing.mp3'})
  await sound.initialize();await sound.unlock()
  assert.equal(audio.volume,1)
  blocked=false;await sound.unlock()
  assert.equal(plays,1)
  await sound.dispose()
})
test('native audio preloads once, plays the existing asset, and unloads on leaving chat',async()=>{
  const calls=[]
  const nativeAudio={async preload(options){calls.push(['preload',options])},async play(options){calls.push(['play',options])},async unload(options){calls.push(['unload',options])}}
  const sound=createTypingSound({native:true,nativeAudio})
  await sound.initialize();await sound.initialize();await sound.play();await sound.dispose()
  assert.deepEqual(calls.map(call=>call[0]),['preload','play','unload'])
  assert.equal(calls[0][1].assetPath,'typing.mp3')
  assert.equal(calls[1][1].assetId,calls[2][1].assetId)
})
