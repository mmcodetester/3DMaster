import test from 'node:test'
import assert from 'node:assert/strict'
import { conversationOnline, conversationPreview, latestMessage, messageKey, mergeMessage, sortedMessages, clientMessageId } from '../src/utils/chat-messages.js'
test('cached messages remain isolated between accounts and senders', () => {
  const message = {sender_id:2,client_id:'phone-1'}
  assert.notEqual(messageKey(1,message),messageKey(3,message))
  assert.notEqual(messageKey(1,message),messageKey(1,{...message,sender_id:4}))
})
test('a server acknowledgement reconciles a queued message without changing its identity', () => {
  const pending = {sender_id:2,client_id:'phone-1',text:'Hello',syncStatus:'pending'}
  const synced = mergeMessage(pending,{...pending,server_id:99})
  assert.equal(synced.syncStatus,'synced')
  assert.equal(messageKey(2,pending),messageKey(2,synced))
  assert.deepEqual(mergeMessage(synced,synced),synced)
})
test('messages follow server order with offline messages at the end in creation order', () => {
  const rows = [{server_id:null,date:'2026-01-02'},{server_id:9},{server_id:3},{server_id:null,date:'2026-01-01'}]
  assert.deepEqual(sortedMessages(rows),[rows[2],rows[1],rows[3],rows[0]])
  assert.equal(rows[0].server_id,null)
})
test('client IDs are unique and accepted by the server ID contract', () => {
  const ids = Array.from({length:100},clientMessageId)
  assert.equal(new Set(ids).size,100)
  ids.forEach(id=>assert.match(id,/^[a-zA-Z0-9_-]{1,80}$/))
})


test('conversation presence requires a connected online participant in that conversation', () => {
  const people = [{id:2,online:true},{id:3,online:false}]
  const direct = {type:'direct',members:[{id:1},{id:3}]}
  assert.equal(conversationOnline(direct,people,true,1),false)
  assert.equal(conversationOnline({...direct,members:[{id:1},{id:2}]},people,true,1),true)
  assert.equal(conversationOnline({type:'general'},people,false,1),false)
  assert.equal(conversationOnline({type:'group',members:[{id:1},{id:2}]},people,true,1),true)
})
test('older history cannot replace the latest preview and queued messages reconcile on acknowledgement', () => {
  const current = {sender_id:1,client_id:'new',server_id:10,text:'Newest'}
  assert.equal(latestMessage(current,{...current,client_id:'old',server_id:2,text:'Old'}).text,'Newest')
  const pending = {sender_id:1,client_id:'queue',text:'Queued',syncStatus:'pending'}
  assert.equal(latestMessage(pending,current).text,'Queued')
  assert.equal(latestMessage(pending,{...pending,server_id:11}).syncStatus,'synced')
  assert.equal(conversationPreview(pending,1,'direct'),'Queued · You: Queued')
  assert.equal(conversationPreview({sender_id:2,sender:'Aye',text:'Hello\nteam'},1,'group'),'Aye: Hello team')
  assert.equal(conversationPreview(null,1,'direct'),'No messages yet')
})
