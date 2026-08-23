export function pointsForAnswer(correct: boolean, startedAt: string, submittedAt: string, base: number, config: { tiers?: { seconds:number; points:number }[] } | null) {
  if (!correct) return 0;
  const seconds = (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  const tier = config?.tiers?.sort((a,b) => a.seconds-b.seconds).find(t => seconds <= t.seconds);
  return tier?.points ?? base;
}
