import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import * as rules from '../src/utils/chat-messages.js'

function setup() {
  const tables = {}
  const notificationCalls = []
  const savedSettings = new Map()
  class Table {
    constructor(){ this.rows = new Map() }
    async get(key){ return structuredClone(this.rows.get(key)) }
    async put(row){ this.rows.set(row.key,structuredClone(row)) }
    async bulkPut(rows){ for(const row of rows) await this.put(row) }
    async update(key,values){ const row=this.rows.get(key); if(row) Object.assign(row,structuredClone(values)) }
    where(index){ return {equals:value=>{
      const match=row=>index.startsWith('[') ? row.account_id===value[0] && row.room_id===value[1] : row[index]===value
      return {toArray:async()=>structuredClone([...this.rows.values()].filter(match)),delete:async()=>{for(const [key,row] of this.rows)if(match(row))this.rows.delete(key)}}
    }} }
  }
  class Dexie {
    constructor(){ this.rooms=tables.rooms ||= new Table(); this.messages=tables.messages ||= new Table() }
    version(){ return {stores(){}} }
    async transaction(...args){ return args.at(-1)() }
  }
  let login={data:{id:1,name:'One'},token:'test-session'}
  let failSend=false, waitRooms=null
  const sockets=[], requests=[], serverMessages=[]
  const rooms=[{id:1,type:'general',name:'General',members:[]}]
  const service={
    GetRooms:async()=>{if(waitRooms) await waitRooms;return {data:structuredClone(rooms)}},
    GetUsers:async()=>({data:[{id:2,name:'Two',online:false}]}),
    Get:async params=>{
      requests.push({...params})
      const items=serverMessages.filter(row=>row.room_id===params.room_id && (!params.cursor || row.server_id>params.cursor))
      const selected=params.cursor ? items.slice(0,params.limit) : items.slice(-params.limit)
      return {data:{messages:structuredClone(selected),has_more:items.length>selected.length}}
    },
    SendMessage:async input=>{
      let saved=serverMessages.find(row=>row.sender_id===login.data.id && row.client_id===input.client_id)
      if(!saved){saved={...input,server_id:serverMessages.length+1,sender_id:login.data.id,sender:login.data.name,date:new Date().toISOString()};serverMessages.push(saved)}
      if(failSend) throw new Error('Connection lost after the server saved the message')
      return {data:structuredClone(saved)}
    },
    SendTypingEvent:async()=>({}),
  }
  const context={
    createNotificationDelivery:()=>({start:async()=>{},stop:async()=>{},enable:async()=>{},disable:async()=>{},clearRoom:async()=>{},notify:async message=>notificationCalls.push(message)}),
    localStorage:{getItem:key=>savedSettings.get(key),setItem:(key,value)=>savedSettings.set(key,value)},
    Dexie,reactive:value=>value,io:()=>{
      const socket={handlers:{},on(event,fn){this.handlers[event]=fn},removeAllListeners(){this.handlers={}},disconnect(){}}
      sockets.push(socket);return socket
    },
    chatService:service,getLoginInfo:()=>login,...rules,
    navigator:{onLine:true},document:{hidden:false,addEventListener(){},removeEventListener(){}},
    window:{location:{origin:'http://test.local'},addEventListener(){},removeEventListener(){}},
    setInterval:()=>1,clearInterval(){},setTimeout,clearTimeout,console,structuredClone,
  }
  let source=fs.readFileSync(new URL('../src/services/chat.state.js',import.meta.url),'utf8')
    .replace(/^import .*$/gm,'').replace(/export /g,'').replace('import.meta.env.VITE_SOCKET_URL',"''")
  source+='\n;({chat,startChat,stopChat,syncChat,selectRoom,sendMessage,setViewingRoom})'
  const state=vm.runInNewContext(source,context)
  async function settle(){for(let i=0;i<15;i++)await new Promise(resolve=>setImmediate(resolve))}
  return {state,context,tables,sockets,requests,serverMessages,notificationCalls,setLogin:value=>{login=value},setFail:value=>{failSend=value},setWait:value=>{waitRooms=value},settle}
}
test('offline queue survives restart and an ambiguous send acknowledgement without duplicate server messages',async()=>{
  const f=setup()
  await f.state.startChat();await f.settle()
  f.context.navigator.onLine=false
  await f.state.sendMessage('Offline message')
  assert.equal(f.state.chat.messages[0].syncStatus,'pending')
  f.state.stopChat()
  await f.state.startChat()
  assert.equal(f.state.chat.messages[0].text,'Offline message')
  f.setFail(true);f.context.navigator.onLine=true
  await f.state.syncChat();await f.settle()
  assert.equal(f.serverMessages.length,1)
  f.setFail(false)
  await f.state.syncChat();await f.settle()
  assert.equal(f.serverMessages.length,1)
  assert.equal(f.state.chat.messages.length,1)
  assert.equal(f.state.chat.messages[0].syncStatus,'synced')
  f.state.stopChat()
})
test('account switching does not expose another account’s cache or accept stale socket messages',async()=>{
  const f=setup()
  await f.state.startChat();await f.settle()
  f.context.navigator.onLine=false
  await f.state.sendMessage('Account one private queue')
  const staleHandler=f.sockets[0].handlers.message
  f.state.stopChat()
  f.setLogin({data:{id:2,name:'Two'},token:'other-session'})
  await f.state.startChat();await f.settle()
  await staleHandler({sender_id:3,client_id:'old-socket',server_id:100,room_id:1,text:'Old session event'})
  assert.equal(f.state.chat.messages.length,0)
  assert.equal([...f.tables.messages.rows.values()].filter(row=>row.account_id===2).length,0)
  f.state.stopChat()
})
test('a newer socket message never skips missed messages during reconnect catch-up',async()=>{
  const f=setup()
  f.serverMessages.push({sender_id:2,client_id:'m1',server_id:1,room_id:1,text:'First',date:new Date().toISOString()})
  await f.state.startChat();await f.settle()
  for(let id=2;id<=125;id++)f.serverMessages.push({sender_id:2,client_id:`m${id}`,server_id:id,room_id:1,text:`Message ${id}`,date:new Date().toISOString()})
  await f.sockets[0].handlers.message(f.serverMessages.at(-1))
  await f.state.syncChat();await f.settle()
  assert.equal(f.state.chat.messages.length,125)
  assert.ok(f.requests.some(request=>request.cursor===1 && request.direction==='forward'))
  assert.ok(f.requests.some(request=>request.cursor===101))
  f.state.stopChat()
})
test('messages queued during a running sync are sent immediately after it completes',async()=>{
  const f=setup()
  await f.state.startChat();await f.settle()
  let release
  f.setWait(new Promise(resolve=>{release=resolve}))
  const ongoing=f.state.syncChat()
  await f.state.sendMessage('Queued during sync')
  release();f.setWait(null)
  await ongoing;await f.settle()
  assert.equal(f.serverMessages.length,1)
  assert.equal(f.state.chat.messages[0].syncStatus,'synced')
  f.state.stopChat()
})

test('conversation previews update immediately for incoming and queued messages and survive restart',async()=>{
  const f=setup()
  await f.state.startChat();await f.settle()
  await f.sockets[0].handlers.message({sender_id:2,client_id:'incoming',server_id:8,room_id:1,text:'Latest incoming',date:new Date().toISOString()})
  assert.equal(f.state.chat.rooms[0].last_message.text,'Latest incoming')
  f.context.navigator.onLine=false
  await f.state.sendMessage('Offline reply')
  assert.equal(f.state.chat.rooms[0].last_message.syncStatus,'pending')
  f.state.stopChat()
  await f.state.startChat()
  assert.equal(f.state.chat.rooms[0].last_message.text,'Offline reply')
  f.state.stopChat()
})

test('typing events repeat for the same person but ignore other rooms and own typing',async()=>{
  const f=setup()
  await f.state.startChat();await f.settle()
  const typing=f.sockets[0].handlers.typing
  typing({room_id:1,sender_id:2,sender:'Two'})
  assert.equal(f.state.chat.typing,'Two is typing…')
  assert.equal(f.state.chat.typingPulse,1)
  typing({room_id:1,sender_id:2,sender:'Two'})
  assert.equal(f.state.chat.typingPulse,2)
  typing({room_id:5,sender_id:2,sender:'Two'})
  typing({room_id:1,sender_id:1,sender:'One'})
  assert.equal(f.state.chat.typingPulse,2)
  f.state.stopChat()
})


test('live messages and reconnect catch-up notify once without notifying initial history or own messages',async()=>{
  const f=setup()
  f.serverMessages.push({sender_id:2,client_id:'m1',server_id:1,room_id:1,text:'Initial history',date:new Date().toISOString()})
  await f.state.startChat();await f.settle()
  assert.equal(f.notificationCalls.length,0)
  const live={sender_id:2,client_id:'m2',server_id:2,room_id:1,text:'New incoming',date:new Date().toISOString()}
  f.serverMessages.push(live)
  await f.sockets[0].handlers.message(live)
  await f.sockets[0].handlers.message(live)
  await f.state.syncChat();await f.settle()
  assert.equal(f.notificationCalls.length,1)
  f.serverMessages.push({...live,server_id:3,client_id:'m3',text:'Missed while disconnected'})
  await f.state.syncChat();await f.settle()
  assert.equal(f.notificationCalls.length,2)
  await f.sockets[0].handlers.message({...live,server_id:4,client_id:'mine',sender_id:1})
  assert.equal(f.notificationCalls.length,2)
  f.state.stopChat()
})
