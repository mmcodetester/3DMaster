import api from "./api"
import AuthHeader from "./auth.header"

class DashboardService{
    GetDailyCompairsm(){
        return api.get('/dashboard/getdailycompairsm', {headers: AuthHeader()})
    }
    GetMonthlyCompairsm(){
        return api.get('/dashboard/getmonthlycompairsm', {headers: AuthHeader()})
    }
}
export default new DashboardService()