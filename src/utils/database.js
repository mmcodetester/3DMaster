import Dexie from 'dexie';

export const db = new Dexie('ChatDatabase');

db.version(1).stores({
  messages: '++id, server_id, sender_id, text, date, syncStatus, is_read'
});
