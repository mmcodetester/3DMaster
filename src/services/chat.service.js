import axios from 'axios'
import api from './api'
const requestOptions = { timeout: 15_000 }
export default {
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
