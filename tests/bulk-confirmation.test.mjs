import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

function setup() {
    const source=readFileSync(new URL('../src/views/Report/UnOrderReport.vue',import.meta.url),'utf8')
    const handlers=source.slice(source.indexOf('const ConfirmSelected ='),source.indexOf('watch(() => pagination.value.search'))
    let requests=[],prompts=[],refreshes=0
    const state={
        selectedIds:{value:[11,22]},pendingIds:{value:[]},submitting:{value:false},
        confirmRef:{value:{OpenDialog:(...args)=>prompts.push(args)}},
        otherorderService:{ConfirmOrders:async ids=>{requests.push(ids);return{data:{success:true,messages:['done']}}}},
        snackbarRef:{value:{OpenSnackbar(){}}},GetAll:async()=>{refreshes++},
    }
    vm.runInNewContext(handlers+';globalThis.handlers={ConfirmSelected,Confirm,Edit}',state)
    return{...state,requests,prompts,refreshes:()=>refreshes}
}

test('bulk button opens confirmation with count without sending a request',()=>{
    const state=setup()
    state.handlers.ConfirmSelected()
    assert.equal(state.prompts.length,1)
    assert(state.prompts[0][1].includes('2'))
    assert.equal(state.requests.length,0)
})
test('cancel keeps selection and makes no submission',async()=>{
    const state=setup()
    state.handlers.ConfirmSelected()
    await state.handlers.Confirm(false)
    assert.equal(state.requests.length,0)
    assert.equal(state.selectedIds.value.length,2)
    assert.equal(state.pendingIds.value.length,0)
})
test('explicit confirmation submits exact selected snapshot once then refreshes',async()=>{
    const state=setup()
    state.handlers.ConfirmSelected()
    state.selectedIds.value.push(33)
    await state.handlers.Confirm(true)
    await state.handlers.Confirm(true)
    assert.equal(state.requests.length,1)
    assert.equal(JSON.stringify(state.requests[0]),'[11,22]')
    assert.equal(JSON.stringify(state.selectedIds.value),'[33]')
    assert.equal(state.refreshes(),1)
})
test('empty selection or non-boolean confirmation never submits',async()=>{
    const state=setup()
    state.selectedIds.value=[]
    state.handlers.ConfirmSelected()
    assert.equal(state.prompts.length,0)
    state.pendingIds.value=[11]
    await state.handlers.Confirm('true')
    assert.equal(state.requests.length,0)
})
