import api from "./api"
import AuthHeader from "./auth.header";

class MonthlyAmountService{
    GetAll(param){
        const config = {
            headers: AuthHeader(),
            params: {
                draw: 1,
                sortBy: param.sortBy[0] ? param.sortBy[0].key : 'id',
                sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                page: param.page,
                length: param.itemsPerPage,
                name : param.name ? param.name : '',
                year: param.search.year,
                month_id : param.search.month_id
            },
        };
        return api.get('/monthlyamount', config)
    }
    Save(data) {
        return api.post("/monthlyamount", data, { headers: AuthHeader() });
    }
    Delete(id) {
        return api.delete("/monthlyamount/delete?id=" + id, { headers: AuthHeader() });
    }
    GetById(id) {
        return api.get("/monthlyamount/getbyid?id=" + id, { headers: AuthHeader() });
    }
    ChangeStauts(id) {
        return api.get("/monthlyamount/changestatus?id=" + id, { headers: AuthHeader() });
    }
    GetActiveAmount(){
        return api.get("/monthlyamount/getactiveamount", { headers: AuthHeader() });
    }
}

export default new MonthlyAmountService()