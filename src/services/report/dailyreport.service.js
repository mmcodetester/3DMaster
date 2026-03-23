import api from "../api";
import AuthHeader from "../auth.header";

class DailyReportService {
    GetAll(param){
        const config = {
            headers: AuthHeader(),
            params: {
                draw: 1,
                sortBy: param.sortBy[0] ? param.sortBy[0].key : 'number',
                sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                page: param.page,
                length: param.itemsPerPage,
                name: param.search.name ? param.search.name : '',
                date : param.search.date
            },
        };
        return api.get('/dailyreport', config)
    }
    ExportExcel(param){
        const config = {
            headers: AuthHeader(),
            params: {
                draw: 1,

                sortBy: param.sortBy[0] ? param.sortBy[0].key : 'id',
                sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                page: param.page,
                length: param.itemsPerPage,
                 name: param.search.name ? param.search.name : '',
                date : param.search.date
            },
            responseType: 'blob'   
        };
        return api.get('/dailyreport/export-excel', config)
    }
    GetAllDetailReport(param) {
        const config = {
            headers: AuthHeader(),
            params: {
                draw: 1,

                sortBy: param.sortBy[0] ? param.sortBy[0].key : 'id',
                sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                page: param.page,
                length: param.itemsPerPage,
                name: param.search.name ? param.search.name : '',
                date : param.search.date
            },
        };
        return api.get('/dailyreport/detail-report', config)
    }
    ExportExcelDetailReport(param) {
        const config = {
            headers: AuthHeader(),
            params: {
                draw: 1,

                sortBy: param.sortBy[0] ? param.sortBy[0].key : 'id',
                sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                page: param.page,
                length: param.itemsPerPage,
                 name: param.search.name ? param.search.name : '',
                date : param.search.date
            },
            responseType: 'blob'   
        };
        return api.get('/dailyreport/export-excel-detail-report', config)
    }
    GetTodayTotal() {
        return api.get('/dailyreport/gettodaytotal', { headers: AuthHeader() })
    }
}
export default new DailyReportService()