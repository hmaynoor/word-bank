"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {CardRow, Meaning} from "@/app/type";
import {UI, Card, Chip} from "@/app/styles/userinterfacestyle";
import {Button} from "@/app/styles/buttonstyle";
import {Textarea} from "@/app/styles/textAreaStyle";
import {PillTabs} from "@/app/styles/pilltabsStyle";
import { PageShell } from "./styles/pageShellStyle";
import { Title } from "./styles/titleStyle";
import { LandingPage } from "@/components/ui/landingpage";
import { BankTab } from "@/components/ui/tabs/bank";
import { AddTab } from "@/components/ui/tabs/add";
import { ReviewTab } from "@/components/ui/tabs/review";


export default function Page() {
  /////////////////////////////////// 
  // States
  ///////////////////////////////////

  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");

  const [word, setWord] = useState("");
  const [meanings, setMeanings] = useState<Meaning[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [tab, setTab] = useState<"add" | "review" | "bank">("add");

  // Editing
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editDefinition, setEditDefinition] = useState("");
  const [editExample, setEditExample] = useState("");

  // Review
  const [reviewIndex, setReviewIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewMode, setReviewMode] = useState<"due" | "random">("due");

  // Test modes
  const [testMode, setTestMode] = useState<"flashcard" | "type" | "mcq">("flashcard");
  const [typed, setTyped] = useState("");
  const [mcqOptions, setMcqOptions] = useState<CardRow[]>([]);
  const [mcqChoiceId, setMcqChoiceId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [mcqResult, setMcqResult] = useState<"correct" | "wrong" | null>(null);

  //Word Bank

  const [definition, setDefintiion]  = useState<CardRow>();


  /////////////////////////////////// 
  // Functions
  ///////////////////////////////////

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Log-in Functions
  async function signIn() {
    setStatus("Sending magic link…");
    const { error } = await supabase.auth.signInWithOtp({ email });
    setStatus(error ? error.message : "Check your email for the login link.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Card Functions
  async function refreshCards() {
    if (!session) return;
    const { data, error } = await supabase.from("cards").select("*").order("created_at", { ascending: false });
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

  async function saveMeaning(m: Meaning) {
    if (!session) return;

    const payload = {
      user_id: session.user.id,
      word: word.trim().toLowerCase(),
      part_of_speech: m.partOfSpeech ?? null,
      definition: m.definition,
      example: m.example ?? null,
      synonyms: m.synonyms ?? [],
      due_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("cards").insert(payload);
    setStatus(error ? error.message : "Saved ✓");
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

  // Testing Functions
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

    setStatus(error ? error.message : correct ? `Nice  ツ — due again in ${days} day${days === 1 ? "" : "s"}` : "🔁 Again soon");
    setRevealed(false);
    setMcqChoiceId(null);
    setMcqResult(null);
    nextQuestion();
    await refreshCards();
  }

  function buildMcqOptions(correct: CardRow) {
    const pool = cards.filter((c) => c.id !== correct.id);
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

    // Editing Pane Functions
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

    setStatus("Updated ✓");
    setEditingCard(null);
    await refreshCards();
  }

  async function deleteCard(id: string) {
    const ok = confirm("Delete this word?");
    if (!ok) return;

    const { error } = await supabase.from("cards").delete().eq("id", id);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Deleted");
    setEditingCard(null);
    await refreshCards();
  }




  /////////////////////////////////// 
  // Landing Page 
  ///////////////////////////////////
  if (!session) {
    return (
      <PageShell>
        <LandingPage
          email={email}
          setEmail={setEmail}
          signIn={signIn}
        />
      </PageShell>
    );
  }

  /////////////////////////////////// 
  // App
  ///////////////////////////////////
  return (
    <PageShell>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Title 
          length={cards.length}
          due={dueCards.length}
        />
        <Button onClick={signOut} variant="ghost">
          Sign out
        </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
        <PillTabs
          value={tab}
          onChange={(v) => setTab(v as any)}
          items={[
            { value: "add", label: "Add" },
            { value: "review", label: "Review" },
            { value: "bank", label: "Word Bank" },
          ]}
        />

        {status ? (
          <div style={{ color: UI.muted, fontSize: 13, fontWeight: 650, maxWidth: 320, textAlign: "right" }}>
            {status}
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* ADD */}
      {tab === "add" && (
        <AddTab
          word={word}
          setWord={setWord}
          setStatus={setStatus}
          setMeanings={setMeanings}
          meanings={meanings}
          saveMeaning={saveMeaning}
        />
      )}

      {/* REVIEW */}
      {tab === "review" && (
        <ReviewTab
          revealed={revealed}
          mcqOptions={mcqOptions}
          mcqChoiceId={mcqChoiceId}
          mcqResult={mcqResult}
          setMcqChoiceId={setMcqChoiceId}
          setMcqResult={setMcqResult}
          setRevealed={setRevealed}
          mark={mark}
          setReviewMode={setReviewMode}
          typed={typed}
          setTyped={setTyped}
          reviewMode={reviewMode}
          setReviewIndex={setReviewIndex}
          testMode={testMode}
          setTestMode={setTestMode}
          currentReviewCard={currentReviewCard}
          cards={cards}
         />
      )}

      {/* BANK */}
     {tab === "bank" && (
      <BankTab
        word={word}
        setWord={setWord}
        cards={cards}
        startEdit={startEdit}
        deleteCard={deleteCard}
      />
    )}


      
      {/* Editing panel */}
      {editingCard && (
        <div style={{ marginTop: 16 }}>
          <Card style={{ boxShadow: UI.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: UI.muted, fontWeight: 750, letterSpacing: 0.4 }}>Editing</div>
                <div style={{ marginTop: 6, fontSize: 22, fontWeight: 850, fontFamily: UI.fontSerif }}>
                  {editingCard.word}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={saveEdits} variant="primary">
                  Save
                </Button>
                <Button onClick={() => setEditingCard(null)} variant="ghost">
                  Cancel
                </Button>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: UI.muted, fontWeight: 750, marginBottom: 6 }}>Definition</div>
              <Textarea rows={3} value={editDefinition} onChange={(e) => setEditDefinition(e.target.value)} />
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: UI.muted, fontWeight: 750, marginBottom: 6 }}>Example</div>
              <Textarea rows={2} value={editExample} onChange={(e) => setEditExample(e.target.value)} placeholder="Add your own example sentence" />
            </div>
          </Card>
        </div>
      )}

    </PageShell>
  );
}
