import api from "./api";
import AuthHeader from "./auth.header";

class OrderService{
    GetAll(param){
            const config = {
                headers: AuthHeader(),
                params: {
                    draw: 1,
                    sortBy: param.sortBy[0] ? param.sortBy[0].key : 'id',
                    sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                    page: param.page == 1 ? 0 : param.page,
                    length: param.itemsPerPage,
                    name : param.name ? param.name : '',
                },
            };
            return api.get('/order', config)
        }
        Save(data) {
            return api.post("/order", data, { headers: AuthHeader() });
        }
        Delete(id) {
            return api.delete("/order/delete?id=" + id, { headers: AuthHeader() });
        }
        GetById(id) {
            return api.get("/order/getbyid?id=" + id, { headers: AuthHeader() });
        }
}
export default new OrderService()