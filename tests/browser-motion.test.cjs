const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('lib/browser-motion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const values=new Map(),events=[];const mod={exports:{}};
vm.runInNewContext(source,{module:mod,exports:mod.exports,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},window:{dispatchEvent:e=>events.push(e.type)},Event:class{constructor(type){this.type=type}},require:()=>({useSyncExternalStore:(_,read)=>read()})});
assert.equal(mod.exports.useFullMotion(),false);mod.exports.saveFullMotion(true);assert.equal(mod.exports.useFullMotion(),true);assert.equal(values.size,1);assert.deepEqual(events,['certpro:motion-preference']);mod.exports.saveFullMotion(false);assert.equal(mod.exports.useFullMotion(),false);console.log('PASS: browser-local opt-in, default system preference, reversible setting');
