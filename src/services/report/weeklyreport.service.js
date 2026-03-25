import api from "../api";
import AuthHeader from "../auth.header";

class WeeklyReportService {
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
                created_by: param.search.user_id,
                number: param.search.number
            },
        };
        return api.get('/weeklyreport', config)
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
                created_by: param.search.user_id,
                number: param.search.number
            },
            responseType: 'blob'
        };
        return api.get('/weeklyreport/export-excel', config)
    }
    GetDetailsTotalAmount(param){
        const config = {
            headers: AuthHeader(),
            params: {
                name: param.search.name ?? '',
                date: param.search.date,
                created_by: param.search.user_id,
                number: param.search.number
            },
        };
        return api.get('/weeklyreport/gettotal',config)
    }
}
export default new WeeklyReportService()