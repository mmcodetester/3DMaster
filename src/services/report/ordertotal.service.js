import api from "../api"
import AuthHeader from "../auth.header"

class OrderTotalService{
    Get(){
        return api.get('/ordertotal', {headers: AuthHeader()})
    }
}

export default new OrderTotalService()