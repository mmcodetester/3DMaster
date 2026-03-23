import api from "./api";
import AuthHeader from "./auth.header";

class DropDownService {
    GetMonthList(){
        return api.get('/dropdown/get_month_list', {headers:AuthHeader()})
    }
}
export default new DropDownService()