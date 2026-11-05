const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('components/block-reveal.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function fixture({reduced=false,paused=false,delayed=false,fullMotion=false,mobile=false,variant='rise'}={}){
 let effect,observer,cleanup,mutation;const events={},mediaEvents={};const animations=[];
 const cards=Array.from({length:4},()=>({contains:target=>target=== 'focused',animate:(frames,options)=>{const a={frames,options,canceled:false,cancel(){this.canceled=true}};animations.push(a);return a}}));
 const root={querySelectorAll:()=>delayed?[]:cards,addEventListener:(k,v)=>events[k]=v,removeEventListener:k=>delete events[k]};
 const doc={visibilityState:'visible',activeElement:null,addEventListener:(k,v)=>events[k]=v,removeEventListener:k=>delete events[k]};
 const media={matches:reduced,addEventListener:(k,v)=>mediaEvents[k]=v,removeEventListener:k=>delete mediaEvents[k]};
 const module={exports:{}};
 const context={module,exports:module.exports,Element:{prototype:{animate(){}}},document:doc,matchMedia:q=>q.includes('reduced')?media:{matches:mobile},MutationObserver:class{constructor(cb){this.cb=cb;mutation=this}observe(){}disconnect(){this.disconnected=true}},IntersectionObserver:class{constructor(cb){this.cb=cb;this.observed=[];observer=this}observe(e){this.observed.push(e)}unobserve(e){this.observed=this.observed.filter(x=>x!==e)}disconnect(){this.observed=[]}},require:n=>n==='@/lib/browser-motion'?{useFullMotion:()=>fullMotion}:n==='react'?{useRef:v=>({current:v===null?root:v}),useEffect:fn=>effect=fn}:{jsx:(type,props)=>({type,props})}};
 vm.runInNewContext(source,context);const rendered=module.exports.BlockReveal({children:'content',selector:'.card',paused,variant});cleanup=effect();
 return {replace:()=>{const old=cards[0];cards[0]={...old};mutation.cb();assert(!observer.observed.includes(old));assert(observer.observed.includes(cards[0]));},hydrate:()=>{delayed=false;mutation.cb();assert.equal(observer.observed.length,4)},leave:()=>observer.cb(cards.map(target=>({target,isIntersecting:false}))),cards,animations,events,media,mediaEvents,doc,rendered,cleanup,enter:()=>observer.cb(cards.map((target,i)=>({target,isIntersecting:true,boundingClientRect:{top:100,left:i*100}})))};
}
const normal=fixture();assert.equal(normal.rendered.props.style.display,'contents');normal.enter();assert.equal(normal.animations.length,4);assert.deepEqual(normal.animations.map(a=>a.options.delay),[0,100,200,200]);assert(normal.animations.every(a=>a.options.duration<=700&&a.options.fill==='backwards'));normal.enter();assert.equal(normal.animations.length,4,'does not restart while visible');normal.events.focusin({target:'focused'});assert(normal.animations.every(a=>a.canceled));normal.cleanup();
const reduced=fixture({reduced:true});reduced.enter();assert.equal(reduced.animations.length,4);assert(reduced.animations.every(a=>a.options.duration===450&&a.options.delay===0&&a.frames[0].transform===undefined&&a.frames[0].filter===undefined));reduced.cleanup();
const hidden=fixture();hidden.enter();hidden.doc.visibilityState='hidden';hidden.events.visibilitychange();assert(hidden.animations.every(a=>a.canceled));hidden.cleanup();
const change=fixture();change.enter();change.media.matches=true;change.mediaEvents.change();assert(change.animations.every(a=>a.canceled));change.cleanup();
const stopped=fixture({paused:true});assert.equal(stopped.animations.length,0);assert.equal(stopped.cleanup,undefined);
const unmount=fixture();unmount.enter();unmount.cleanup();assert(unmount.animations.every(a=>a.canceled));assert.equal(Object.keys(unmount.events).length,0);
console.log('PASS: capped stagger, stable visibility, reduced motion, focus, hidden document, pause and unmount cleanup');

const late=fixture({delayed:true});late.hydrate();late.enter();assert.equal(late.animations.length,4);late.cleanup();

const phone=fixture({mobile:true});phone.enter();assert.equal(phone.animations[0].options.duration,560);assert(phone.animations[0].frames[0].transform.includes('24px'));assert.equal(phone.animations[0].frames[0].filter,undefined,'no card blur on mobile');phone.cleanup();
const words=fixture({variant:'words',mobile:true});words.enter();assert.equal(words.animations[0].frames[0].filter,'blur(2px)');words.cleanup();
console.log('PASS: stronger entrances, mobile transform budget and word reveal');

const replay=fixture();replay.enter();replay.enter();assert.equal(replay.animations.length,4);replay.leave();assert(replay.animations.every(a=>a.canceled));replay.enter();assert.equal(replay.animations.length,8,'replays on re-entry');replay.cleanup();
console.log('PASS: automatic re-entry replay, no repeat while visible, reduced-motion gentle fade');

const filtered=fixture();filtered.enter();filtered.replace();filtered.enter();assert.equal(filtered.animations.length,5,"new filtered card is observed");filtered.cleanup();

const override=fixture({reduced:true,fullMotion:true});override.enter();assert.equal(override.animations[0].options.duration,700);assert(override.animations[0].frames[0].transform.includes("48px"));override.cleanup();
