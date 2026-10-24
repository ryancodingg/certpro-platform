// Return only learner-visible fields; never return stored question snapshots, answer keys, or attempt secrets.
export function progressSummary(records:{id:string;data:Record<string,any>}[],uid:string){
 const saved:any[]=[];const attempts:any[]=[]
 for(const {id,data:a} of records){if(a.uid!==uid)continue
 if(a.kind==='saved'){saved.push({certification:a.certification,studiedSections:a.studiedSections||[],savedAt:a.savedAt});continue}
 if(!a.certification||!['practice','exam'].includes(a.mode))continue
 const result=a.submitted?JSON.parse(a.result):null;const answers=JSON.parse(a.answers||'{}');const questions=JSON.parse(a.questions||'[]')
 attempts.push({id,certification:a.certification,mode:a.mode,section:a.section||null,answeredIds:Object.keys(answers),total:questions.length,submitted:!!a.submitted,score:result?.score??null,correct:result?.correct??null,createdAt:a.createdAt,submittedAt:a.submittedAt||null,updatedAt:a.updatedAt||a.submittedAt||a.createdAt,abandoned:!!a.abandoned})}
 attempts.sort((a,b)=>(b.updatedAt||b.submittedAt||b.createdAt).localeCompare(a.updatedAt||a.submittedAt||a.createdAt))
 return {saved,attempts}
}
