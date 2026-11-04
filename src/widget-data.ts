export type Mission = { id: string; title: string; done: boolean };
export type Flashcard = { id: string; question: string; answer: string };
export type Game = { id: string; title: string; status: "Queued" | "Playing" | "Completed" };
export type WidgetData = { studyMissions: Mission[]; gamingGoals: Mission[]; flashcards: Flashcard[]; games: Game[] };
export const dedicatedWidgets = [
  { id: "study-missions", name: "Study missions", desc: "Plan assignments and track your progress.", custom: false },
  { id: "study-cards", name: "Recall orbit", desc: "Create flashcards and practise active recall.", custom: false },
  { id: "gaming-library", name: "Game hangar", desc: "Track your backlog and what you are playing.", custom: false },
  { id: "gaming-goals", name: "Quest log", desc: "Keep your next achievements in sight.", custom: false },
];
export function workspaceWidgets(name: string, icon: string) {
  if (icon === "study" || /study|school|learn/i.test(name)) return ["study-missions", "study-cards"];
  if (icon === "gaming" || /gaming|games/i.test(name)) return ["gaming-library", "gaming-goals"];
  return [];
}
export function readWidgetData(value: unknown): WidgetData {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rows = (key: string): Record<string, unknown>[] => Array.isArray(data[key])
    ? data[key].filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && typeof x.id === "string").slice(0, 100) : [];
  const missions = (key: string) => rows(key).filter(x => typeof x.title === "string").map(x => ({ id: x.id as string, title: (x.title as string).slice(0, 160), done: x.done === true }));
  return {
    studyMissions: missions("studyMissions"), gamingGoals: missions("gamingGoals"),
    flashcards: rows("flashcards").filter(x => typeof x.question === "string" && typeof x.answer === "string").map(x => ({ id: x.id as string, question: (x.question as string).slice(0, 300), answer: (x.answer as string).slice(0, 600) })),
    games: rows("games").filter(x => typeof x.title === "string").map(x => ({ id: x.id as string, title: (x.title as string).slice(0, 160), status: (["Queued", "Playing", "Completed"].includes(x.status as string) ? x.status : "Queued") as Game["status"] })),
  };
}
