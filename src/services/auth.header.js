import { getLoginInfo } from './auth.session.js'

export default function AuthHeader() {
    const login = getLoginInfo()
    return login ? { Authorization: `Bearer ${login.token}` } : {}
}
