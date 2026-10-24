import { QuizRunner } from "@/components/quiz-runner"
export default async function Page({searchParams}:{searchParams:Promise<{certification?:string;section?:string;resume?:string}>}){
 const {certification='',section='',resume=''}=await searchParams
 return <QuizRunner key={`${certification}:${section}:${resume}`} certification={certification} mode="practice" initialSection={section} resumeId={resume}/>
}
