import test from 'node:test'
import assert from 'node:assert/strict'
import { formatUnsubmittedOrders } from '../src/utils/unsubmitted-copy.js'

const row = (number, total_amount, total_extra = 0) => ({ number, total_amount, total_extra })
const variants = ['123','132','213','231','312','321']

test('plain amount and extra match the requested paste notation', () => {
    assert.equal(formatUnsubmittedOrders([row('231',200),row('112',100,100)]), '112=100*100,\n231=200,')
})
test('complete permutation group is compressed to R with the correct base amount', () => {
    const input=variants.map(number=>row(number,number==='123'?100:20))
    assert.equal(formatUnsubmittedOrders(input), '123=100R20,')
})
test('R can use an outlier number other than the first sorted variant', () => {
    assert.equal(formatUnsubmittedOrders(variants.map(number=>row(number,number==='231'?200:20))), '231=200R20,')
})
test('partial and differently priced permutation groups do not invent or change orders', () => {
    assert.equal(formatUnsubmittedOrders([row('123',100),row('231',200)]), '123=100,\n231=200,')
    const input=variants.map((number,index)=>row(number,(index+1)*10))
    assert.equal(formatUnsubmittedOrders(input), input.map(r=>`${r.number}=${r.total_amount},`).join('\n'))
})
test('extra values never disappear into R notation', () => {
    const result=formatUnsubmittedOrders(variants.map(number=>row(number,100,number==='123'?20:0)))
    assert(!result.includes('R'))
    assert(result.includes('123=100*20,'))
    assert.equal(result.split('\n').length,6)
})
test('duplicate rows sum both amounts and preserve leading zeros', () => {
    assert.equal(formatUnsubmittedOrders([row('001','100','20'),row('001',50,null),row('000',0,30)]), '000=0*30,\n001=150*20,')
})
test('repeated digits compress only distinct permutations; a single number stays plain', () => {
    assert.equal(formatUnsubmittedOrders([row('112',100),row('121',20),row('211',20)]), '112=100R20,')
    assert.equal(formatUnsubmittedOrders([row('111',100)]), '111=100,')
})
test('empty and invalid rows cannot create a partial or misleading copy', () => {
    assert.equal(formatUnsubmittedOrders([]),'')
    for(const input of [row(null,100),row('',100),row('123',null),row('123','oops'),row('123',-1),row('123',100,-5),row('1234',100)]) {
        assert.throws(()=>formatUnsubmittedOrders([row('001',100),input]))
    }
})
