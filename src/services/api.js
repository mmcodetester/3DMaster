import axios from 'axios'
import { clearLoginInfo, getLoginInfo } from './auth.session.js'

const api = axios.create({ baseURL: import.meta.env?.VITE_API_URL })
let redirectToLogin = () => {}

export function configureAuthHandling(handler) {
    redirectToLogin = handler
}

const isLoginRequest = config => config?.url?.split('?')[0].endsWith('/auth/login')

api.interceptors.request.use(config => {
    if (isLoginRequest(config)) return config
    const login = getLoginInfo()
    if (!login) {
        redirectToLogin()
        throw new axios.CanceledError('Login is required.', config)
    }
    config.headers.set('Authorization', `Bearer ${login.token}`)
    return config
})

api.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401 && !isLoginRequest(error.config)) {
        const login = getLoginInfo()
        const requestToken = error.config?.headers?.get?.('Authorization')
            ?? error.config?.headers?.Authorization
        // A delayed failure from an old session must not log out a new login.
        if (!login || requestToken === `Bearer ${login.token}`) {
            clearLoginInfo()
            redirectToLogin()
        } else {
            return Promise.reject(new axios.CanceledError('Request belongs to a previous session.', error.config))
        }
    }
    return Promise.reject(error)
})

export default api
