import { useState } from "react";
import { BookOpen, Check, Gamepad2, Orbit, Plus, RotateCw, Trash2 } from "lucide-react";
import { type WidgetData, type Game } from "./widget-data";

export function WorkspaceWidget({ id, data, onChange }: { id: string; data: WidgetData; onChange: (data: WidgetData) => void }) {
  const [draft, setDraft] = useState("");
  const [answer, setAnswer] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const save = (patch: Partial<WidgetData>) => onChange({ ...data, ...patch });

  if (id === "study-cards") {
    const index = data.flashcards.length ? cardIndex % data.flashcards.length : 0;
    const card = data.flashcards[index];
    return <div className="dedicated-widget">
      <div className="widget-heading"><span><BookOpen size={16} /> Recall orbit</span><small>{data.flashcards.length} cards</small></div>
      <p className="mission-caption">A little recall. A brighter constellation.</p>
      {card ? <>
        <button className={`recall-card ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? "Show question" : "Reveal answer"}>
          <small>{flipped ? "ANSWER" : "QUESTION"} · {index + 1}/{data.flashcards.length}</small>
          <span>{flipped ? card.answer : card.question}</span>
          <small><RotateCw size={12} /> {flipped ? "Back to question" : "Tap to reveal"}</small>
        </button>
        <div className="mission-actions"><button onClick={() => { setCardIndex(index + 1); setFlipped(false); }}>Next card →</button><button aria-label="Delete flashcard" onClick={() => { save({ flashcards: data.flashcards.filter(x => x.id !== card.id) }); setFlipped(false); }}><Trash2 size={14} /></button></div>
      </> : <div className="mission-empty"><Orbit size={28} /><p>Your knowledge constellation starts with one card.</p></div>}
      <form className="mission-form" onSubmit={e => { e.preventDefault(); if (!draft.trim() || !answer.trim() || data.flashcards.length >= 100) return; save({ flashcards: [...data.flashcards, { id: crypto.randomUUID(), question: draft.trim(), answer: answer.trim() }] }); setDraft(""); setAnswer(""); }}>
        <input aria-label="Flashcard question" placeholder="Question or term" maxLength={300} value={draft} onChange={e => setDraft(e.target.value)} required />
        <input aria-label="Flashcard answer" placeholder="Answer or definition" maxLength={600} value={answer} onChange={e => setAnswer(e.target.value)} required />
        <button className="mission-add" disabled={data.flashcards.length >= 100}><Plus size={14} /> Add flashcard</button>
      </form>
      {data.flashcards.length >= 100 && <small>Deck full · remove a card to add another.</small>}
    </div>;
  }
  if (id === "gaming-library") {
    const statuses: Game["status"][] = ["Queued", "Playing", "Completed"];
    return <div className="dedicated-widget">
      <div className="widget-heading"><span><Gamepad2 size={16} /> Game hangar</span><small>{data.games.length} games</small></div>
      <p className="mission-caption">Choose your next world. Track every adventure.</p>
      <div className="mission-list">{data.games.length ? data.games.map(game => <div className="mission-row game-row" key={game.id}>
        <Gamepad2 size={16} /><span>{game.title}</span>
        <button className={`game-status ${game.status.toLowerCase()}`} aria-label={`Change status for ${game.title}: ${game.status}`} onClick={() => save({ games: data.games.map(x => x.id === game.id ? { ...x, status: statuses[(statuses.indexOf(x.status) + 1) % 3] } : x) })}>{game.status}</button>
        <button aria-label={`Remove ${game.title}`} onClick={() => save({ games: data.games.filter(x => x.id !== game.id) })}><Trash2 size={13} /></button>
      </div>) : <div className="mission-empty"><Gamepad2 size={28} /><p>Your hangar is ready. Add a game to your backlog.</p></div>}</div>
      <form className="mission-form" onSubmit={e => { e.preventDefault(); if (!draft.trim() || data.games.length >= 100) return; save({ games: [...data.games, { id: crypto.randomUUID(), title: draft.trim(), status: "Queued" }] }); setDraft(""); }}>
        <input aria-label="Game title" placeholder="Add a game to your hangar" maxLength={160} value={draft} onChange={e => setDraft(e.target.value)} required />
        <button className="mission-add" disabled={data.games.length >= 100}><Plus size={14} /> Add game</button>
      </form><small className="mission-caption">Tap a status: Queued → Playing → Completed</small>
      {data.games.length >= 100 && <small>Hangar full · remove a game to add another.</small>}
    </div>;
  }
  const study = id === "study-missions";
  const field = study ? "studyMissions" : "gamingGoals";
  const missions = data[field];
  const completed = missions.filter(x => x.done).length;
  return <div className="dedicated-widget">
    <div className="widget-heading"><span>{study ? <BookOpen size={16} /> : <Orbit size={16} />}{study ? "Study missions" : "Quest log"}</span><small>{completed}/{missions.length} complete</small></div>
    <p className="mission-caption">{study ? "Small steps toward your next breakthrough." : "Every achievement starts with a mission."}</p>
    <progress className="mission-progress" max={missions.length || 1} value={completed} aria-label={study ? "Study progress" : "Quest progress"} />
    <div className="mission-list">{missions.length ? missions.map(mission => <div className={`mission-row ${mission.done ? "complete" : ""}`} key={mission.id}>
      <label><input type="checkbox" checked={mission.done} onChange={() => save({ [field]: missions.map(x => x.id === mission.id ? { ...x, done: !x.done } : x) })} /><span>{mission.title}</span></label>
      <button aria-label={`Delete ${mission.title}`} onClick={() => save({ [field]: missions.filter(x => x.id !== mission.id) })}><Trash2 size={13} /></button>
    </div>) : <div className="mission-empty"><Orbit size={28} /><p>{study ? "Plot your course. Add your first assignment." : "Set a goal for your next gaming session."}</p></div>}</div>
    {missions.length > 0 && completed === missions.length && <p className="mission-complete"><Check size={14} /> All missions accomplished.</p>}
    <form className="mission-form" onSubmit={e => { e.preventDefault(); if (!draft.trim() || missions.length >= 100) return; save({ [field]: [...missions, { id: crypto.randomUUID(), title: draft.trim(), done: false }] }); setDraft(""); }}>
      <input aria-label={study ? "New study mission" : "New gaming quest"} placeholder={study ? "Read chapter 4, revise biology…" : "Finish a campaign, unlock an achievement…"} maxLength={160} value={draft} onChange={e => setDraft(e.target.value)} required />
      <button className="mission-add" disabled={missions.length >= 100}><Plus size={14} /> {study ? "Add mission" : "Add quest"}</button>
    </form>{missions.length >= 100 && <small>Log full · remove a mission to add another.</small>}
  </div>;
}
