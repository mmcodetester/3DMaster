import api from "./api";
import AuthHeader from "./auth.header";
class UserService{
    GetAll(param) {
        const config = {
            headers: AuthHeader(),
            params: {
                draw: 1,
                sortBy: param.sortBy[0] ? param.sortBy[0].key : 'id',
                sortOrder: param.sortBy[0] ? param.sortBy[0].order : 'desc',
                page: param.page == 1 ? 1 : param.page,
                length: param.itemsPerPage,
                name : param.search.name ? param.search.name : '',
                role_id : param.search.role_id
            },
        };
        return api.get('/user', config );
    }
    Save(user) {
        return api.post("/user", user, { headers: AuthHeader() });
    }
    Delete(id) {
        return api.delete("/user/delete?id=" + id, { headers: AuthHeader() });
    }
    GetById(id) {
        return api.get("/user/getbyid?id=" + id, { headers: AuthHeader() });
    }
    ChangeStatus(id){
        return api.get(`/user/change_status?id=${id}`, {headers: AuthHeader()})
    }
    GetCount(){
        return api.get(`/user/get_count`, {headers: AuthHeader()})
    }
}
export default new UserService();