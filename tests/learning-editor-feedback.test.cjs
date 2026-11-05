const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..'),cache={};let syncs=0;
function load(file){if(cache[file])return cache[file].exports;const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});assert.equal(result.diagnostics.length,0,file);const mod={exports:{}};cache[file]=mod;new Function('require','module','exports',result.outputText)(name=>{
 if(name.endsWith('.module.css'))return new Proxy({},{get:(_,key)=>key});
 if(name==='@/lib/study-workspace-sync')return {queueWorkspaceSync:()=>syncs++,watchWorkspaceSync:()=>()=>{}};
 if(name==='@/lib/learner-client')return {learnerFetch:()=>{throw Error('No network expected')}};
 if(name==='./study-document-connections')return {StudyDocumentConnections:()=>null};
 if(name==='@/lib/study-document')return {documentHtml:()=>'',readDocument:()=>[],escapeText:t=>t};
 if(name.startsWith('@/')||name.startsWith('.')){const relative=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);return load(fs.existsSync(relative+'.tsx')?relative+'.tsx':relative+'.ts')}
 return require(name)
},mod,mod.exports);return mod.exports}
const store=new Map();let fail=false;
global.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('Storage full');store.set(k,v)}};global.window={dispatchEvent:()=>{}};
const {appendWorkspaceNote}=load(root+'/components/study-workspace.tsx');
const {readWorkspace,initial,persist}=load(root+'/lib/study-workspace.ts');
const workspace=initial('');workspace.pages[0].title='My networking notes';persist('learner',workspace,null);
const destination=appendWorkspaceNote('learner','A default route matches any destination.');
assert.equal(destination.title,'My networking notes');assert.equal(destination.id,workspace.activePage);assert.equal(readWorkspace('learner').pages.at(0).blocks.at(-1).text,'A default route matches any destination.');assert.equal(syncs,1);
assert.equal(readWorkspace('other-user'),null);
fail=true;assert.throws(()=>appendWorkspaceNote('learner','Must not report a destination'),/Storage/);assert.equal(syncs,1);fail=false;
const {StudyDocumentEditor}=load(root+'/components/study-document-editor.tsx');
const html=renderToStaticMarkup(React.createElement(StudyDocumentEditor,{page:workspace.pages[0],onChange:()=>{}}));
assert(!html.includes('Autosaved'));assert(html.includes('aria-label="Study document"'));assert.equal((html.match(/aria-pressed="false"/g)||[]).length,3);assert(html.includes('role="textbox"'));assert(html.includes('aria-multiline="true"'));
console.log('PASS: note destination matches persisted page, account isolation, storage failure prevents success/sync, editor semantics and initial formatting state');
