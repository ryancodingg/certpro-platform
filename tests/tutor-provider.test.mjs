import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import {runInNewContext} from 'node:vm'
// Exercise the production adapter without loading Next's server-only/Firebase modules.
const source=readFileSync(new URL('../lib/server/tutor.ts',import.meta.url),'utf8').replace(/^import .*$/gm,'').replace(/^export /gm,'')
class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
const adapter=runInNewContext(stripTypeScriptTypes(source)+'\n;({geminiConfiguration,requestGemini,requireTutorAcknowledgement})',{HttpError,process:{env:{}},AbortSignal,fetch:()=>{throw Error('Unexpected real network call')}})
const config=adapter.geminiConfiguration({GEMINI_API_KEY:' fake-test-key '})
const response=(value,status=200)=>new Response(JSON.stringify(value),{status})
test('requires Gemini key; never falls back to existing OpenAI key',()=>{
 assert.throws(()=>adapter.geminiConfiguration({OPENAI_API_KEY:'fake-openai'}),e=>e.status===503)
 assert.equal(config.key,'fake-test-key');assert.equal(config.model,'gemini-3.5-flash-lite')
 assert.throws(()=>adapter.geminiConfiguration({GEMINI_API_KEY:'fake',GEMINI_TUTOR_MODEL:'../../bad'}),e=>e.status===503)
})
test('uses Google REST header, separates system prompt, and omits tools/account details',async()=>{
 const text=await adapter.requestGemini(config,'{"question":"Question?"}','simplify',async(url,options)=>{
  assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent')
  assert.equal(options.headers['x-goog-api-key'],'fake-test-key')
  const body=JSON.parse(options.body)
  assert.match(body.contents[0].parts[0].text,/simpler language/)
  assert.match(body.systemInstruction.parts[0].text,/untrusted data/)
  assert.equal(body.tools,undefined);assert.equal(body.uid,undefined)
  assert.equal(body.generationConfig.maxOutputTokens,1600)
  return response({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'private thought'},{text:'Helpful explanation'}]}}]})
 })
 assert.equal(text,'Helpful explanation')
})
test('quota exhaustion returns useful 429 without retries or paid fallback',async()=>{
 let count=0
 await assert.rejects(adapter.requestGemini(config,'{}','explain',async()=>{count++;return response({},429)}),e=>e.status===429&&/No paid fallback/.test(e.message))
 assert.equal(count,1)
})
test('blocks truncated, safety-blocked, empty and malformed output',async()=>{
 for(const data of [{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'partial'}]}}]},{promptFeedback:{blockReason:'SAFETY'}},{candidates:[{finishReason:'STOP',content:{parts:[]}}]}]){
  await assert.rejects(adapter.requestGemini(config,'{}','example',async()=>response(data)),e=>e.status===503)
 }
 await assert.rejects(adapter.requestGemini(config,'{}','example',async()=>new Response('bad json')),e=>e.status===503)
})
test('provider rejection and network errors do not expose provider payloads or secrets',async()=>{
 await assert.rejects(adapter.requestGemini(config,'{}','explain',async()=>response({error:'secret value'},403)),e=>e.status===503&&!e.message.includes('secret'))
 await assert.rejects(adapter.requestGemini(config,'{}','explain',async()=>{throw Error('secret value')}),e=>e.status===503&&!e.message.includes('secret'))
})

test('AI acknowledgement rejects missing, false and truthy values; accepts only explicit boolean true',()=>{
 for(const value of [undefined,null,false,0,1,'true',{}])assert.throws(()=>adapter.requireTutorAcknowledgement(value),e=>e.status===403)
 assert.doesNotThrow(()=>adapter.requireTutorAcknowledgement(true))
})
