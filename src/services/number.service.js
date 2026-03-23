import api from "./api";
import AuthHeader from "./auth.header";

class NumberServer{
    GetAll(search){
        return api.get(`/number?number=${search}`, {headers: AuthHeader()})
    }
}

export default new NumberServer()