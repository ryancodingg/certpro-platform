import { QuizRunner } from "@/components/quiz-runner"
export default async function Page({params,searchParams}:{params:Promise<{certification:string}>;searchParams:Promise<{mode?:string;section?:string;resume?:string}>}){
 const {certification}=await params
 const {mode,section='',resume=''}=await searchParams
 return <QuizRunner key={`${certification}:${mode}:${section}:${resume}`} certification={certification} mode={mode==='exam'?'exam':'practice'} initialSection={mode==='exam'?'':section} resumeId={mode==='exam'?'':resume}/>
}
