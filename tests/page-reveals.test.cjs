const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('components/page-reveals.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
function render(path){const mod={exports:{}};vm.runInNewContext(source,{module:mod,exports:mod.exports,require:n=>n==='next/navigation'?{usePathname:()=>path}:n==='./block-reveal'?{BlockReveal:'reveal'}:{jsx:(type,props,key)=>({type,props,key})}});return mod.exports.PageReveals({children:'content'});}
assert.notEqual(render('/').type,'reveal');
for(const path of ['/certifications','/news','/news/article','/certification/dp-700','/progress']){const r=render(path);assert.equal(r.type,'reveal');assert.equal(r.key,path);assert(r.props.selector.includes('.cp-news-card'));assert(r.props.selector.includes('h2'));assert(r.props.selector.includes('[contenteditable]'));}
for(const path of ['/practice','/quiz/cisco-ccna','/my-learning','/admin']){const r=render(path);assert(!r.props.selector.includes('h2'));assert(r.props.selector.includes('h1'));}
console.log('PASS: reading page coverage, working surface exclusions, no duplicate homepage reveals, route reset');
