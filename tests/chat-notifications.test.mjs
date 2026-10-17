import test from 'node:test'
import assert from 'node:assert/strict'
import { createChatNotifications, notificationTarget, shouldNotifyChat } from '../src/utils/chat-notifications.js'
function fixture(native=false,nativePushEnabled=true) {
  const delivered=[], values=new Map(), notifications=[], opened=[], state=[], nativeHandlers={}, localHandlers={}, appHandlers={}, devices=[]
  let active=true,view=null,pushConfigured=false,permission='default',permissionPrompts=0
  const listener=(store)=>(event,fn)=>{store[event]=fn;return Promise.resolve({remove(){if(store[event]===fn)delete store[event]}})}
  const local={addListener:listener(localHandlers),checkPermissions:async()=>({display:permission}),requestPermissions:async()=>{permissionPrompts++;permission='granted';return{display:permission}},createChannel:async()=>{},schedule:async data=>notifications.push(...data.notifications),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{}}
  const push={addListener:listener(nativeHandlers),register:async()=>{await nativeHandlers.registration?.({value:'fake-fcm-token-abcdefghijklmnop'})},unregister:async()=>devices.push('unregister'),getDeliveredNotifications:async()=>({notifications:delivered}),removeDeliveredNotifications:async()=>{}}
  const app={addListener:listener(appHandlers),getState:async()=>({isActive:active})}
  const worker={showNotification:async(title,options)=>notifications.push({title,...options}),getNotifications:async()=>[]}
  const manager=createChatNotifications({native,nativePushEnabled,local,push,app,storage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},
    onState:value=>state.push(value),registerDevice:async(...args)=>{devices.push(args);return{data:{push_configured:pushConfigured}}},unregisterDevice:async(...args)=>devices.push(args),
    browser:{supported:true,permission:()=>permission,requestPermission:async()=>{permissionPrompts++;permission='granted';return permission},registerWorker:async()=>worker,chatUrl:room=>`https://test.local/live-chat?room=${room}`,icon:'/icon',onMessage:()=>()=>{},show:async()=>{throw new Error('Worker should be used')}},
  })
  const options=account=>({accountId:account,token:`jwt-${account}`,installationId:'installation-abcdefghijklmnop',viewingRoom:()=>view,isActive:()=>active,onOpen:room=>opened.push(room),onIncoming(){},onActive:value=>{active=value}})
  const message={server_id:10,room_id:2,sender_id:3,sender:'Sender',text:'Hello'}
  return{manager,options,message,values,notifications,opened,delivered,state,nativeHandlers,localHandlers,devices,permissionPrompts:()=>permissionPrompts,setActive:value=>{active=value},setView:value=>{view=value},setPush:value=>{pushConfigured=value}}
}
test('notifications request permission only from Enable and suppress own/read messages and duplicates',async()=>{
  const f=fixture()
  await f.manager.start(f.options(1))
  assert.equal(f.permissionPrompts(),0)
  await f.manager.notify(f.message,{type:'direct'})
  assert.equal(f.notifications.length,0)
  await f.manager.enable()
  assert.equal(f.permissionPrompts(),1)
  f.setView(2)
  await f.manager.notify(f.message,{type:'direct'})
  assert.equal(f.notifications.length,0)
  f.setActive(false)
  await f.manager.notify(f.message,{type:'direct'})
  await f.manager.notify(f.message,{type:'direct'})
  await f.manager.notify({...f.message,server_id:11,sender_id:1},{type:'direct'})
  assert.equal(f.notifications.length,1)
  assert.equal(f.notifications[0].body,'Hello')
  await f.manager.stop()
})
test('notification deduplication persists across restarts and tap targets are account-isolated',async()=>{
  const f=fixture(true)
  await f.manager.start(f.options(1));await f.manager.enable()
  await f.manager.notify(f.message,{type:'group',name:'Team'})
  const oldTap=f.localHandlers.localNotificationActionPerformed
  oldTap({notification:{extra:{account_id:1,room_id:2}}})
  oldTap({notification:{extra:{account_id:2,room_id:9}}})
  assert.deepEqual(f.opened,[2])
  await f.manager.stop();await f.manager.start(f.options(1))
  await f.manager.notify(f.message,{type:'group',name:'Team'})
  assert.equal(f.notifications.length,1)
  await f.manager.stop();await f.manager.start(f.options(2))
  oldTap({notification:{extra:{account_id:1,room_id:2}}})
  assert.deepEqual(f.opened,[2])
  await f.manager.stop()
})
test('native push handles background display while foreground alerts remain local and deduplicated',async()=>{
  const f=fixture(true)
  f.setPush(true)
  await f.manager.start(f.options(1));await f.manager.enable()
  assert.equal(f.state.at(-1).pushReady,true)
  f.setActive(false)
  await f.manager.notify(f.message,{type:'direct'})
  assert.equal(f.notifications.length,0)
  f.setActive(true)
  await f.manager.notify({...f.message,server_id:11},{type:'direct'})
  await f.nativeHandlers.pushNotificationReceived({data:{type:'chat',account_id:'1',room_id:'2',message_id:'11',sender_id:'3',sender:'Sender',text:'Hello',room_type:'direct'}})
  assert.equal(f.notifications.length,1)
  await f.manager.disable()
  assert.ok(f.devices.includes('unregister'))
  await f.manager.notify({...f.message,server_id:12},{type:'direct'})
  assert.equal(f.notifications.length,1)
  await f.manager.stop()
})
test('notification routing rejects invalid room IDs and other accounts',()=>{
  assert.equal(notificationTarget({room_id:'5',account_id:'1'},1),5)
  assert.equal(notificationTarget({room_id:'5',account_id:'2'},1),null)
  for(const room_id of [0,-1,'bad',1.5])assert.equal(notificationTarget({room_id,account_id:1},1),null)
  assert.equal(shouldNotifyChat({server_id:1,sender_id:1,room_id:2},1,null,false),false)
})


test('missing Firebase configuration keeps local notifications working without native push registration',async()=>{
  const f=fixture(true,false)
  await f.manager.start(f.options(1));await f.manager.enable()
  assert.equal(f.state.at(-1).pushReady,false)
  assert.equal(f.devices.length,0)
  await f.manager.notify(f.message,{type:'direct'})
  assert.equal(f.notifications.length,1)
  await f.manager.stop()
})
test('messages already displayed by Android push are not duplicated by reconnect catch-up',async()=>{
  const f=fixture(true)
  f.delivered.push({tag:'chat-1-2-10',data:{}})
  await f.manager.start(f.options(1));await f.manager.enable()
  await f.manager.notify(f.message,{type:'direct'})
  assert.equal(f.notifications.length,0)
  await f.manager.stop()
})
