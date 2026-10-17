import test from 'node:test'
import assert from 'node:assert/strict'
import { copyText } from '../src/utils/clipboard.js'

function setup(writeText, succeeds = true) {
    let copied, removed = false, restored = false
    const textarea = { value:'', style:{}, setAttribute(){}, focus(){}, select(){}, setSelectionRange(){}, remove(){removed=true} }
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:writeText?{writeText}:undefined}})
    globalThis.document = {
        activeElement:{focus(){restored=true}}, getSelection:()=>null,
        createElement:()=>textarea, body:{appendChild(){}},
        execCommand(command){ assert.equal(command,'copy'); copied=textarea.value;return succeeds },
    }
    return () => ({copied,removed,restored})
}

test('uses browser clipboard when available', async()=>{
    let result
    const state=setup(async text=>{result=text})
    await copyText('001=100,')
    assert.equal(result,'001=100,')
    assert.equal(state().removed,false)
})
test('falls back when modern clipboard is denied', async()=>{
    const state=setup(async()=>{throw new Error('Permission denied')})
    await copyText('112=100*100,')
    assert.deepEqual(state(),{copied:'112=100*100,',removed:true,restored:true})
})
test('supports WebViews without modern clipboard API', async()=>{
    const state=setup()
    await copyText('123=100R20,')
    assert.equal(state().copied,'123=100R20,')
    assert.equal(state().removed,true)
})
test('reports unavailable clipboard and always removes temporary selection', async()=>{
    const state=setup(undefined,false)
    await assert.rejects(copyText('231=200,'))
    assert.equal(state().removed,true)
    assert.equal(state().restored,true)
})
