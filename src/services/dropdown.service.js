import api from "./api";
import AuthHeader from "./auth.header";

class DropDownService {
    GetMonthList(){
        return api.get('/dropdown/getmonthlist', {headers:AuthHeader()})
    }
    GetUserList(){
        return api.get('/dropdown/getuserlist', {headers:AuthHeader()})
    }
    GetWeeklyAmountList(year){
        return api.get(`/dropdown/getweeklistbyyear?year=${year}`, {headers: AuthHeader()})
    }
}
export default new DropDownService()