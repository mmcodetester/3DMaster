import axios from 'axios'
import api from './api'
const requestOptions = { timeout: 15_000 }
export default {
  Delete: (roomId, messageId) => api.delete(`/chat/rooms/${roomId}/messages/${messageId}`, requestOptions),
  Deletions: roomId => api.get(`/chat/rooms/${roomId}/deletions`, requestOptions),
  Read: (roomId, messageId) => api.post(`/chat/rooms/${roomId}/read`, { message_id: messageId }, requestOptions),
  Pin: (roomId, messageId, pinned) => api.post(`/chat/rooms/${roomId}/messages/${messageId}/pin`, { pinned }, requestOptions),
  Upload: (roomId, file, onProgress, name, clientId) => api.post(`/chat/rooms/${roomId}/attachments`, file, {
    timeout: 120_000, headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(name || file.name || 'attachment'), 'X-Upload-Id': clientId },
    onUploadProgress: event => onProgress?.(event.total ? Math.round(event.loaded * 100 / event.total) : 0),
  }),
  Download: id => api.get(`/chat/attachments/${id}`, { timeout: 120_000, responseType: 'blob' }),
  DiscardUpload: id => api.delete(`/chat/attachments/${id}`, requestOptions),
  RegisterDevice: data => api.post('/chat/devices', data, requestOptions),
  UnregisterDevice: (installationId, token) => axios.delete('/chat/devices', {
    baseURL: api.defaults.baseURL, ...requestOptions, data: { installation_id: installationId },
    headers: { Authorization: 'Bearer ' + token },
  }),
  Get: params => api.get('/chat', { ...requestOptions, params }),
  GetRooms: () => api.get('/chat/rooms', requestOptions),
  GetUsers: () => api.get('/chat/users', requestOptions),
  CreateRoom: data => api.post('/chat/rooms', data, requestOptions),
  SendMessage: data => api.post('/chat/send', data, requestOptions),
  SendTypingEvent: roomId => api.post('/chat/typing', { room_id: roomId }, requestOptions),
}
