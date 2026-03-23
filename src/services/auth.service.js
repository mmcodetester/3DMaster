import api from "./api";
import AuthHeader from "./auth.header";

class AuthService {
    Login(user) {
        return api.post('/auth/login', user)
            .then(res => {
                if (res.data) {
                    if (res.data.token) {
                        localStorage.setItem('2duser', JSON.stringify(res.data));
                    }
                }
                return res.data;
            });
    }
    Logout(){
        return api.get('/auth/logout', {headers: AuthHeader()})
    }
}

export default new AuthService()