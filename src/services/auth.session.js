const LOGIN_KEY = '2duser'

export function clearLoginInfo() {
    localStorage.removeItem(LOGIN_KEY)
}

export function getLoginInfo() {
    try {
        const login = JSON.parse(localStorage.getItem(LOGIN_KEY))
        if (typeof login?.token === 'string' && login.token.trim() && Number(login.data?.id) > 0) {
            return login
        }
    } catch {
        // Invalid or incomplete saved sessions must not mount protected pages.
    }
    clearLoginInfo()
    return null
}

export function getAuthRedirect(to) {
    const login = getLoginInfo()
    if (to.name !== 'Login' && !login) return { name: 'Login', replace: true }
    return true
}
