import api from "./api"
import AuthHeader from "./auth.header"
class ChatService {
    Get(){
        return api.get(`/chat`, {headers: AuthHeader()})
    }
    SendMessage(message){
         return api.post(`/chat/send`, message, {headers: AuthHeader()})
    }
    SendTypingEvent(){
        return api.get(`/chat/sendtypingevent`, {headers: AuthHeader()})
    }
}
export default new ChatService()