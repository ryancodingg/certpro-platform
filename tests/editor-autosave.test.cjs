const assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
const source=fs.readFileSync('components/study-document-editor.tsx','utf8');
const functions=source.slice(source.indexOf(' function save('),source.indexOf(' useLayoutEffect('));
const js=ts.transpile(functions,{target:ts.ScriptTarget.ES2020});
let scheduled=new Map(),id=0,saves=0,pendingCalls=0;
const root={current:{text:'initial'}},current={current:{blocks:[]}},last={current:JSON.stringify([{text:'initial'}])},dirty={current:false},timer={current:null};
const changeRef={current:edit=>{saves++;edit(current.current)}};
const api=new Function('root','current','last','dirty','timer','changeRef','readDocument','onPending','setTimeout','clearTimeout',js+';return {save,scheduleSave}')(
root,current,last,dirty,timer,changeRef,el=>[{text:el.text}],()=>pendingCalls++,fn=>{scheduled.set(++id,fn);return id},key=>scheduled.delete(key));
for(let i=0;i<100;i++){root.current.text='Draft '+i;api.scheduleSave()}
assert.equal(saves,0);assert.equal(scheduled.size,1);assert.equal(pendingCalls,100);
[...scheduled.values()][0]();assert.equal(saves,1);assert.equal(current.current.blocks[0].text,'Draft 99');assert.equal(dirty.current,false);
root.current.text='Leave immediately';api.scheduleSave();api.save();assert.equal(saves,2);assert.equal(scheduled.size,0);assert.equal(current.current.blocks[0].text,'Leave immediately');
api.save();assert.equal(saves,2,'Unchanged blur does not persist again');
api.scheduleSave();api.save();assert.equal(saves,3,'Undo to the saved text still clears parent pending status');
console.log('PASS: 100 rapid edits batched once, immediate flush, timer cancelled, unchanged blur, undo pending state');
