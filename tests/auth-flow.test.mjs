import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import axios from 'axios'
import { createRouter, createMemoryHistory } from 'vue-router'
import api, { configureAuthHandling } from '../src/services/api.js'
import { getLoginInfo, getAuthRedirect } from '../src/services/auth.session.js'

const storage = new Map()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
} })
const saveLogin = (token = 'current-token') => {
    localStorage.setItem('2duser', JSON.stringify({ token, data: { id: 1, name: 'Test' } }))
}
let redirects
let requests
const fail = (config, status) => Promise.reject(new axios.AxiosError(
    `Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', config, null,
    { status, data: {}, headers: {}, config },
))
beforeEach(() => {
    storage.clear()
    redirects = 0
    requests = 0
    configureAuthHandling(() => { redirects++ })
    api.defaults.adapter = async config => {
        requests++
        return { status: 200, data: {}, headers: {}, config }
    }
})

test('protected routes redirect before navigation without login information', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [
        { path: '/', name: 'Home', component: {} },
        { path: '/order', name: 'Order', component: {} },
        { path: '/login', name: 'Login', component: {} },
    ] })
    router.beforeEach(getAuthRedirect)
    await router.push('/')
    assert.equal(router.currentRoute.value.name, 'Login')
    await router.push('/order')
    assert.equal(router.currentRoute.value.name, 'Login')
    saveLogin()
    await router.push('/')
    assert.equal(router.currentRoute.value.name, 'Home')
})

test('malformed and incomplete saved login cannot enter protected routes', () => {
    for (const value of ['{broken', 'null', '{}', JSON.stringify({ token: 'x' }),
        JSON.stringify({ token: '', data: { id: 1 } })]) {
        localStorage.setItem('2duser', value)
        assert.equal(getLoginInfo(), null)
        assert.equal(localStorage.getItem('2duser'), null)
        assert.equal(getAuthRedirect({ name: 'Home' }).name, 'Login')
    }
    assert.equal(getAuthRedirect({ name: 'Login' }), true)
})

test('missing session cancels protected requests before network access', async () => {
    await assert.rejects(api.get('/ordertotal'), axios.isCancel)
    assert.equal(requests, 0)
    assert.equal(redirects, 1)
})

test('valid session attaches the latest token and preserves unrelated storage', async () => {
    saveLogin()
    localStorage.setItem('unrelated', 'keep')
    const result = await api.get('/ordertotal', { headers: { Authorization: 'Bearer old-token' } })
    assert.equal(result.config.headers.get('Authorization'), 'Bearer current-token')
    assert.equal(redirects, 0)
    assert.equal(localStorage.getItem('unrelated'), 'keep')
})

test('401 from Home API clears login and redirects automatically', async () => {
    saveLogin()
    api.defaults.adapter = config => fail(config, 401)
    await assert.rejects(api.get('/dropdown/getallweeklist'))
    assert.equal(localStorage.getItem('2duser'), null)
    assert.equal(redirects, 1)
})

test('server errors and connectivity errors keep the login session', async () => {
    saveLogin()
    api.defaults.adapter = config => fail(config, 500)
    await assert.rejects(api.get('/ordertotal'))
    api.defaults.adapter = () => Promise.reject(new axios.AxiosError('Network Error', 'ERR_NETWORK'))
    await assert.rejects(api.get('/ordertotal'))
    assert.equal(getLoginInfo().token, 'current-token')
    assert.equal(redirects, 0)
})

test('login endpoint works without saved login and its 401 does not trigger logout', async () => {
    await api.post('/auth/login', { username: 'test', password: 'test-only' })
    assert.equal(requests, 1)
    api.defaults.adapter = config => fail(config, 401)
    await assert.rejects(api.post('/auth/login', {}))
    assert.equal(redirects, 0)
})

test('late 401 from previous login cannot clear a new session', async () => {
    saveLogin('previous-token')
    let rejectOldRequest
    let requestStarted
    const started = new Promise(resolve => { requestStarted = resolve })
    api.defaults.adapter = config => new Promise((resolve, reject) => {
        rejectOldRequest = () => fail(config, 401).catch(reject)
        requestStarted()
    })
    const pending = api.get('/ordertotal')
    await started
    saveLogin('new-token')
    rejectOldRequest()
    await assert.rejects(pending, axios.isCancel)
    assert.equal(getLoginInfo().token, 'new-token')
    assert.equal(redirects, 0)
})
