"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type CardRow = {
  id: string;
  word: string;
  part_of_speech: string | null;
  definition: string;
  example: string | null;
  synonyms: any | null;
  due_at: string;
  correct_streak: number;
};

type Meaning = {
  partOfSpeech?: string;
  definition: string;
  example?: string;
  synonyms?: string[];
};

async function lookupWord(word: string): Promise<Meaning[]> {
  const cleaned = word.trim().toLowerCase();
  if (!cleaned) return [];
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleaned)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();

  const meanings: Meaning[] = [];
  for (const entry of data) {
    for (const meaning of entry.meanings ?? []) {
      for (const def of meaning.definitions ?? []) {
        meanings.push({
          partOfSpeech: meaning.partOfSpeech,
          definition: def.definition,
          example: def.example,
          synonyms: (def.synonyms ?? meaning.synonyms ?? []).slice(0, 8),
        });
      }
    }
  }
  // de-dupe
  const seen = new Set<string>();
  return meanings.filter((m) => {
    const key = `${m.partOfSpeech ?? ""}::${m.definition}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");

  const [word, setWord] = useState("");
  const [meanings, setMeanings] = useState<Meaning[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [tab, setTab] = useState<"add" | "review" | "bank">("add");

  // For Editing / Removing Definitions
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editDefinition, setEditDefinition] = useState("");
  const [editExample, setEditExample] = useState("");

  // For Review
  const [reviewIndex, setReviewIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewMode, setReviewMode] = useState<"due" | "random">("due");

  // For Test Modes
  const [testMode, setTestMode] = useState<"flashcard" | "type" | "mcq">("flashcard");
  const [typed, setTyped] = useState("");
  const [mcqOptions, setMcqOptions] = useState<CardRow[]>([]);
  const [mcqChoiceId, setMcqChoiceId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [mcqResult, setMcqResult] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setStatus("Sending magic link…");
    const { error } = await supabase.auth.signInWithOtp({ email });
    setStatus(error ? error.message : "Check your email for the login link.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshCards() {
    if (!session) return;
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setStatus(error.message);
    else setCards((data ?? []) as any);
  }

  useEffect(() => {
    if (session) refreshCards();
  }, [session]);

  const dueCards = useMemo(() => {
    const now = Date.now();
    return cards
      .filter((c) => new Date(c.due_at).getTime() <= now)
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  }, [cards]);

  async function doLookup() {
    setStatus("Looking up…");
    const m = await lookupWord(word);
    setMeanings(m);
    setStatus(m.length ? `Found ${m.length}` : "No results");
  }

  async function saveMeaning(m: Meaning) {
    if (!session) return;

    const payload = {
      user_id: session.user.id,
      word: word.trim().toLowerCase(),
      part_of_speech: m.partOfSpeech ?? null,
      definition: m.definition,
      example: m.example ?? null,
      synonyms: m.synonyms ?? [],
      // due now
      due_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("cards").insert(payload);
    setStatus(error ? error.message : "Saved ✅");
    await refreshCards();
  }

  function currentReviewCard() {
    if (!activeCardId) return null;
    return cards.find((c) => c.id === activeCardId) ?? null;
  }

  function pickNextCardId() {
  if (reviewMode === "due") {
    if (!dueCards.length) return null;
    const c = dueCards[Math.min(reviewIndex, dueCards.length - 1)];
    return c?.id ?? null;
  } else {
    if (!cards.length) return null;
    const c = cards[Math.floor(Math.random() * cards.length)];
    return c?.id ?? null;
  }
}

function nextQuestion() {
  setReviewIndex((i) => i + 1);
}

  async function mark(correct: boolean) {
    const c = currentReviewCard();
    if (!c) return;

    const now = new Date();
    const nextStreak = correct ? (c.correct_streak ?? 0) + 1 : 0;
    const days = correct ? (nextStreak <= 1 ? 1 : nextStreak === 2 ? 2 : nextStreak === 3 ? 4 : 7) : 0;
    const nextDue = correct
      ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 10 * 60 * 1000);

    const { error } = await supabase
      .from("cards")
      .update({
        correct_streak: nextStreak,
        due_at: nextDue.toISOString(),
        last_reviewed_at: now.toISOString(),
      })
      .eq("id", c.id);

    setStatus(error ? error.message : correct ? `Nice — due in ${days}d` : "Again soon");
    setRevealed(false);
    setMcqChoiceId(null);
    setMcqResult(null);
    nextQuestion();
    await refreshCards();
  }

function startEdit(card: any) {
  setEditingCard(card);
  setEditDefinition(card.definition);
  setEditExample(card.example ?? "");
}

async function saveEdits() {
  if (!editingCard) return;

  const { error } = await supabase
    .from("cards")
    .update({
      definition: editDefinition.trim(),
      example: editExample.trim() || null,
    })
    .eq("id", editingCard.id);

  if (error) {
    setStatus(error.message);
    return;
  }

  setStatus("Updated ✅");
  setEditingCard(null);
  await refreshCards();
}

async function deleteCard(id: string) {
  const ok = confirm("Delete this word?");
  if (!ok) return;

  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", id);

  if (error) {
    setStatus(error.message);
    return;
  }

  setStatus("Deleted");
  setEditingCard(null);
  await refreshCards();
}

function buildMcqOptions(correct: CardRow) {
  const pool = cards.filter(c => c.id !== correct.id);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  const opts = [correct, ...shuffled].sort(() => Math.random() - 0.5);
  setMcqOptions(opts);
  setMcqChoiceId(null);
}

useEffect(() => {
  setTyped("");
  setMcqOptions([]);
  setMcqChoiceId(null);
  setMcqResult(null);
  setRevealed(false);

  const nextId = pickNextCardId();
  setActiveCardId(nextId);

  const c = nextId ? cards.find((x) => x.id === nextId) : null;
  if (c && testMode === "mcq") buildMcqOptions(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [reviewIndex, reviewMode, testMode, cards.length, dueCards.length]);

  if (!session) {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "Garamond" }}>
        <h1 style={{ fontSize: 140, fontWeight: 800 }}>Word Bank</h1>
        <p style={{ opacity: 0.8 }}>Log in once and your words sync to laptop + phone.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ flex: 1, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}
          />
          <button onClick={signIn} style={{ padding: "12px 14px" }}>Send link</button>
        </div>
        {status && <p style={{ marginTop: 12 }}>{status}</p>}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: 16, fontFamily: "Garamond" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 140, fontWeight: 800, margin: 0 }}>Word Bank</h1>
          <div style={{ opacity: 0.7, marginTop: 6 }}>
            {cards.length} saved • {dueCards.length} due
          </div>
        </div>
        <button onClick={signOut} style={{ padding: "10px 12px" }}>Sign out</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button onClick={() => setTab("add")} style={{ padding: "8px 10px" }}>
          Add
        </button>
        <button onClick={() => { setTab("review"); setReviewIndex(0); setRevealed(false); }} style={{ padding: "8px 10px" }}>
          Review
        </button>
        <button onClick={() => setTab("bank")} style={{ padding: "8px 10px" }}>
          Word bank
        </button>
        <span style={{ padding: "8px 10px", opacity: 0.8 }}>{status}</span>
      </div>

   {editingCard && (
      <div
        style={{
          marginTop: 16,
          border: "1px solid #e5e5e5",
          borderRadius: 14,
          padding: 14,
          background: "white",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>
          Editing: {editingCard.word}
        </div>

        <textarea
          rows={3}
          value={editDefinition}
          onChange={(e) => setEditDefinition(e.target.value)}
          placeholder="Edit definition"
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 12,
            marginBottom: 10,
          }}
        />

        <textarea
          rows={2}
          value={editExample}
          onChange={(e) => setEditExample(e.target.value)}
          placeholder="Add your own example sentence"
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 12,
            marginBottom: 10,
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={saveEdits} style={{ padding: "10px 12px" }}>
            Save
          </button>
          <button onClick={() => setEditingCard(null)} style={{ padding: "10px 12px", opacity: 0.8 }}>
            Cancel
          </button>
        </div>
      </div>
    )}

      {tab === "add" && (
        <section style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g., specious"
              style={{ flex: 1, minWidth: 240, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}
            />
            <button onClick={doLookup} disabled={!word.trim()} style={{ padding: "12px 14px" }}>
              Lookup
            </button>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            {meanings.map((m, idx) => (
              <div key={idx} style={{ border: "1px solid #e5e5e5", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{m.partOfSpeech ?? "—"}</div>
                  <button onClick={() => saveMeaning(m)}>Save</button>
                </div>
                <div style={{ marginTop: 8 }}>{m.definition}</div>
                {m.example && <div style={{ marginTop: 8, fontStyle: "italic", opacity: 0.85 }}>“{m.example}”</div>}
                {m.synonyms?.length ? (
                  <div style={{ marginTop: 8, opacity: 0.8 }}>Synonyms: {m.synonyms.slice(0, 6).join(", ")}</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "review" && (
        <section style={{ marginTop: 16 }}>

          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => { setReviewMode("due"); setReviewIndex(0); setRevealed(false); }}
              style={{ padding: "8px 10px", opacity: reviewMode === "due" ? 1 : 0.6 }}
            >
              Due
            </button>
            <button
              onClick={() => { setReviewMode("random"); setReviewIndex(0); setRevealed(false); }}
              style={{ padding: "8px 10px", opacity: reviewMode === "random" ? 1 : 0.6 }}
            >
              Random
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <button onClick={() => setTestMode("flashcard")} style={{ padding: "8px 10px", opacity: testMode === "flashcard" ? 1 : 0.6 }}>
              Flashcard
            </button>
            <button onClick={() => setTestMode("type")} style={{ padding: "8px 10px", opacity: testMode === "type" ? 1 : 0.6 }}>
              Type definition
            </button>
            <button onClick={() => setTestMode("mcq")} style={{ padding: "8px 10px", opacity: testMode === "mcq" ? 1 : 0.6 }}>
              Pick definition
            </button>
          </div>

          {(() => {
            const c = currentReviewCard();

            if (!c) {
              return (
                <div style={{ opacity: 0.8 }}>
                  {cards.length ? "Nothing due 🎉 Switch to Random?" : "No words saved yet."}
                </div>
              );
            }

            return (
              <div style={{ border: "1px solid #F6F4F0", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{c.word}</div>
                  <div style={{ opacity: 0.7 }}>{c.part_of_speech ?? "—"}</div>
                </div>

                {testMode === "flashcard" && (
                  <>
                    {!revealed ? (
                      <div style={{ marginTop: 12, opacity: 0.8 }}>Tap reveal.</div>
                    ) : (
                      <>
                        <div style={{ marginTop: 12 }}>{c.definition}</div>
                        {c.example && <div style={{ marginTop: 8, fontStyle: "italic", opacity: 0.85 }}>“{c.example}”</div>}
                      </>
                    )}
                  </>
                )}

                {testMode === "type" && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ opacity: 0.8, marginBottom: 8 }}>Type what you think it means (rough is fine):</div>
                    <textarea
                      rows={3}
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 12 }}
                      placeholder="Your definition…"
                    />
                    {!revealed ? null : (
                      <>
                        <div style={{ marginTop: 12, fontWeight: 700 }}>Dictionary / saved definition</div>
                        <div style={{ marginTop: 6 }}>{c.definition}</div>
                      </>
                    )}
                  </div>
                )}

                {testMode === "mcq" && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ opacity: 0.8, marginBottom: 10 }}>Pick the correct definition:</div>

                    <div style={{ display: "grid", gap: 8 }}>
                      {mcqOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setMcqChoiceId(opt.id)}
                          disabled={mcqResult !== null} // lock after submit
                          style={{
                            textAlign: "left",
                            padding: 12,
                            borderRadius: 12,
                            border: "1px solid #ddd",
                            background: mcqChoiceId === opt.id ? "#f6f6f6" : "white",
                            opacity: mcqResult !== null && mcqChoiceId !== opt.id ? 0.7 : 1,
                          }}
                        >
                          {opt.definition}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          if (!c || !mcqChoiceId) return;
                          const correct = mcqChoiceId === c.id;
                          setMcqResult(correct ? "correct" : "wrong");
                          setRevealed(true);
                        }}
                        disabled={!mcqChoiceId || mcqResult !== null}
                      >
                        Submit
                      </button>

                      {mcqResult !== null && (
                        <button
                          onClick={async () => {
                            // grade + schedule
                            await mark(mcqResult === "correct");
                          }}
                        >
                          Next
                        </button>
                      )}
                    </div>

                    {mcqResult === "correct" && <div style={{ marginTop: 10 }}>✅ Correct</div>}
                    {mcqResult === "wrong" && (
                      <div style={{ marginTop: 10 }}>
                        ❌ Not quite
                        <div style={{ marginTop: 6, opacity: 0.85 }}>
                          Correct answer: <b>{c.definition}</b>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {testMode !== "mcq" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => setRevealed(true)} disabled={revealed}>Reveal</button>
                    <button onClick={() => mark(true)} disabled={!revealed}>✅ Knew it</button>
                    <button onClick={() => mark(false)} disabled={!revealed}>❌ Didn’t know</button>
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {tab === "bank" && (
        <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {cards.map((c) => (
            <div
              key={c.id}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 14,
                padding: 14,
                background: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{c.word}</div>
                  <div style={{ opacity: 0.7, marginTop: 2 }}>
                    {c.part_of_speech ?? "—"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => startEdit(c)} style={{ textDecoration: "underline" }}>
                    Edit
                  </button>
                  <button onClick={() => deleteCard(c.id)} style={{ color: "#b91c1c", textDecoration: "underline" }}>
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>{c.definition}</div>

              {c.example && (
                <div style={{ marginTop: 8, fontStyle: "italic", opacity: 0.85 }}>
                  “{c.example}”
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
