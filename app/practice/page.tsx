import { QuizRunner } from "@/components/quiz-runner"

export default async function Page({ searchParams }: { searchParams: Promise<{ certification?: string }> }) {
  const { certification } = await searchParams
  return <QuizRunner certification={certification ?? ""} mode="practice" />
}
