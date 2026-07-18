import api from "../api";
import AuthHeader from "../auth.header";

class WeeklyAmountPerUserService {
    GetAll(param) {
        const config = {
            headers: AuthHeader(),
            params: {
                draw: 1,
                sortBy: param.sortBy[0] ? param.sortBy[0].key : 'number',
                sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                page: param.page,
                length: param.itemsPerPage,
                name: param.search.name ? param.search.name : '',
                date: param.search.date,
                id: param.search.user_id,
                number: param.search.number,
                monthly_amount_id:param.search.monthly_amount_id
            },
        };
        return api.get('/weeklyamountperuser', config)
    }
    ExportExcel(param) {
        const config = {
            headers: AuthHeader(),
            params: {
                draw: 1,

                sortBy: param.sortBy[0] ? param.sortBy[0].key : 'id',
                sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                page: param.page,
                length: param.itemsPerPage,
                name: param.search.name ? param.search.name : '',
                date: param.search.date,
                id: param.search.user_id,
                number: param.search.number
            },
            responseType: 'blob'
        };
        return api.get('/weeklyamountperuser/export-excel', config)
    }
    GetDetailsTotalAmount(param){
        const config = {
            headers: AuthHeader(),
            params: {
                name: param.search.name ?? '',
                date: param.search.date,
                 name: param.search.name ? param.search.name : '',
                date: param.search.date,
                id: param.search.user_id,
                number: param.search.number,
                monthly_amount_id:param.search.monthly_amount_id
            },
        };
        return api.get('/weeklyamountperuser/gettotal',config)
    }
    GetCompairsm(param){
        const config = {
            headers: AuthHeader(),
            params: {
              
                monthly_amount_id:param.search.monthly_amount_id
            },
        };
        return api.get('/weeklyamountperuser/getcompairsm',config)
    }
}

export default new WeeklyAmountPerUserService()