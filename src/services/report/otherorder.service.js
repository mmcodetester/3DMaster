import api from "../api";
import AuthHeader from "../auth.header";

class OtherOrderService {
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
                monthly_amount_id: param.search.monthly_amount_id,
                number: param.search.number
            },
        };
        return api.get('/otherorder', config)
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
                monthly_amount_id: param.search.monthly_amount_id,
                number: param.search.number
            },
            responseType: 'blob'
        };
        return api.get('/otherorder/export-excel', config)
    }
    GetTotal(param){
        const config = {
            headers: AuthHeader(),
            params: {
                name: param.search.name ?? '',
                date: param.search.date,
                monthly_amount_id: param.search.id,
                number: param.search.number
            },
        };
        return api.get('/otherorder/gettotal',config)
    }
}

export default new OtherOrderService()