const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('components/block-reveal.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function fixture({reduced=false,paused=false,delayed=false}={}){
 let effect,observer,cleanup,mutation;const events={},mediaEvents={};const animations=[];
 const cards=Array.from({length:4},()=>({contains:target=>target=== 'focused',animate:(frames,options)=>{const a={frames,options,canceled:false,cancel(){this.canceled=true}};animations.push(a);return a}}));
 const root={querySelectorAll:()=>delayed?[]:cards,addEventListener:(k,v)=>events[k]=v,removeEventListener:k=>delete events[k]};
 const doc={visibilityState:'visible',activeElement:null,addEventListener:(k,v)=>events[k]=v,removeEventListener:k=>delete events[k]};
 const media={matches:reduced,addEventListener:(k,v)=>mediaEvents[k]=v,removeEventListener:k=>delete mediaEvents[k]};
 const module={exports:{}};
 const context={module,exports:module.exports,Element:{prototype:{animate(){}}},document:doc,matchMedia:q=>q.includes('reduced')?media:{matches:false},MutationObserver:class{constructor(cb){this.cb=cb;mutation=this}observe(){}disconnect(){this.disconnected=true}},IntersectionObserver:class{constructor(cb){this.cb=cb;this.observed=[];observer=this}observe(e){this.observed.push(e)}unobserve(e){this.observed=this.observed.filter(x=>x!==e)}disconnect(){this.observed=[]}},require:n=>n==='react'?{useRef:v=>({current:v===null?root:v}),useEffect:fn=>effect=fn}:{jsx:(type,props)=>({type,props})}};
 vm.runInNewContext(source,context);const rendered=module.exports.BlockReveal({children:'content',selector:'.card',paused});cleanup=effect();
 return {hydrate:()=>{delayed=false;mutation.cb();assert(mutation.disconnected);assert.equal(observer.observed.length,4)},cards,animations,events,media,mediaEvents,doc,rendered,cleanup,enter:()=>observer.cb(cards.map((target,i)=>({target,isIntersecting:true,boundingClientRect:{top:100,left:i*100}})))};
}
const normal=fixture();assert.equal(normal.rendered.props.style.display,'contents');normal.enter();assert.equal(normal.animations.length,4);assert.deepEqual(normal.animations.map(a=>a.options.delay),[0,60,120,120]);assert(normal.animations.every(a=>a.options.duration<=500&&a.options.fill==='none'));normal.enter();assert.equal(normal.animations.length,4,'once per target');normal.events.focusin({target:'focused'});assert(normal.animations.every(a=>a.canceled));normal.cleanup();
const reduced=fixture({reduced:true});reduced.enter();assert.equal(reduced.animations.length,0);reduced.cleanup();
const hidden=fixture();hidden.enter();hidden.doc.visibilityState='hidden';hidden.events.visibilitychange();assert(hidden.animations.every(a=>a.canceled));hidden.cleanup();
const change=fixture();change.enter();change.media.matches=true;change.mediaEvents.change();assert(change.animations.every(a=>a.canceled));change.cleanup();
const stopped=fixture({paused:true});assert.equal(stopped.animations.length,0);assert.equal(stopped.cleanup,undefined);
const unmount=fixture();unmount.enter();unmount.cleanup();assert(unmount.animations.every(a=>a.canceled));assert.equal(Object.keys(unmount.events).length,0);
console.log('PASS: capped stagger, once-only, reduced motion, focus, hidden document, pause and unmount cleanup');

const late=fixture({delayed:true});late.hydrate();late.enter();assert.equal(late.animations.length,4);late.cleanup();
