export default function AuthHeader() {
    let user=JSON.parse(localStorage.getItem('2duser'));

    if (user && user.token) {
        return {
            Authorization: `Bearer ${user.token}`
        };
    } else {
      return{
        
      }
    }
}