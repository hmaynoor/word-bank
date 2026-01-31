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
  const [reviewIndex, setReviewIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editDefinition, setEditDefinition] = useState("");
  const [editExample, setEditExample] = useState("");


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
    if (!dueCards.length) return null;
    return dueCards[Math.min(reviewIndex, dueCards.length - 1)];
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
    setReviewIndex(0);
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
      definition: editDefinition,
      example: editExample || null,
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
  await refreshCards();
}


  if (!session) {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "Geramond" }}>
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
    <main style={{ maxWidth: 860, margin: "40px auto", padding: 16, fontFamily: "Geramond" }}>
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
        <div className="border rounded-lg p-4 space-y-3 mt-6">
          <div className="font-semibold">
            Editing: {editingCard.word}
          </div>

          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={editDefinition}
            onChange={(e) => setEditDefinition(e.target.value)}
            placeholder="Edit definition"
          />

          <textarea
            className="w-full border rounded p-2"
            rows={2}
            value={editExample}
            onChange={(e) => setEditExample(e.target.value)}
            placeholder="Add your own example sentence"
          />

          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded"
              onClick={saveEdits}
            >
              Save
            </button>

            <button
              className="px-3 py-1 text-muted-foreground"
              onClick={() => setEditingCard(null)}
            >
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
          {(() => {
            const c = currentReviewCard();
            if (!c) return <div style={{ opacity: 0.8 }}>Nothing due 🎉</div>;
            return (
              <div style={{ border: "1px solid #F6F4F0", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{c.word}</div>
                  <div style={{ opacity: 0.7 }}>{c.part_of_speech ?? "—"}</div>
                </div>

                {!revealed ? (
                  <div style={{ marginTop: 12, opacity: 0.8 }}>Tap reveal.</div>
                ) : (
                  <>
                    <div style={{ marginTop: 12 }}>{c.definition}</div>
                    {c.example && <div style={{ marginTop: 8, fontStyle: "italic", opacity: 0.85 }}>“{c.example}”</div>}
                  </>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <button onClick={() => setRevealed(true)} disabled={revealed}>Reveal</button>
                  <button onClick={() => mark(true)} disabled={!revealed}>✅ Knew it</button>
                  <button onClick={() => mark(false)} disabled={!revealed}>❌ Didn’t know</button>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {tab === "bank" && (
        <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {cards.map((c) => (
            <div key={c.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-semibold text-lg">{c.word}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.part_of_speech}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="text-sm underline"
                    onClick={() => startEdit(c)}
                  >
                    Edit
                  </button>

                  <button
                    className="text-sm text-red-600 underline"
                    onClick={() => deleteCard(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div>{c.definition}</div>

              {c.example && (
                <div className="italic text-sm text-muted-foreground">
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
