import { QuizRunner } from "@/components/quiz-runner"
export default async function Page({params,searchParams}:{params:Promise<{certification:string}>;searchParams:Promise<{mode?:string}>}) {
  const {certification}=await params
  const {mode}=await searchParams
  return <QuizRunner key={`${certification}:${mode}`} certification={certification} mode={mode==="exam"?"exam":"practice"}/>
}
