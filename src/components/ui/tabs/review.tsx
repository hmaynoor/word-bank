import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {CardRow, Meaning} from "@/app/type";
import {UI, Card, Chip} from "@/app/styles/userinterfacestyle";
import {Button} from "@/app/styles/buttonstyle";
import {Input} from "@/app/styles/inputStyle";
import { doLookup } from "../functions/lookup";
import { PillTabs } from "@/app/styles/pilltabsStyle";
import { Flashcards } from "./test/flashcard";
import { Type } from "@/components/ui/tabs/test/type";
import { MultipleChoice, NonMultipleChoice } from "@/components/ui/tabs/test/mcq";


type ReviewMode = "due" | "random";
type TestMode = "flashcard" | "type" | "mcq";
type McqResult = "correct" | "wrong" | null;


type ReviewTabProps = {
  // state
  revealed: boolean;
  mcqOptions: CardRow[];
  mcqChoiceId: string | null;
  mcqResult: McqResult;
  typed: string;
  reviewMode: ReviewMode;
  testMode: TestMode;
  cards: CardRow[];

  // current card (value, not function)
  currentReviewCard: () => CardRow | null;

  // setters
  setRevealed: React.Dispatch<React.SetStateAction<boolean>>;
  setMcqChoiceId: React.Dispatch<React.SetStateAction<string | null>>;
  setMcqResult: React.Dispatch<React.SetStateAction<McqResult>>;
  setTyped: React.Dispatch<React.SetStateAction<string>>;
  setReviewMode: React.Dispatch<React.SetStateAction<ReviewMode>>;
  setReviewIndex: React.Dispatch<React.SetStateAction<number>>;
  setTestMode: React.Dispatch<React.SetStateAction<TestMode>>;

  // action
  mark: (correct: boolean) => Promise<void>;
};


export function ReviewTab({
  revealed,
  mcqOptions,
  mcqChoiceId,
  mcqResult,
  setMcqChoiceId,
  setMcqResult,
  setRevealed,
  mark,
  typed,
  setTyped,
  reviewMode,
  setReviewMode,
  setReviewIndex,
  testMode,
  setTestMode,
  currentReviewCard,
  cards,

}: ReviewTabProps) {
  const c = currentReviewCard();
      return(
       <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <PillTabs
            value={reviewMode}
            onChange={(v) => {
            setReviewMode(v as any);
            setReviewIndex(0);
            setRevealed(false);
            }}
            items={[
            { value: "due", label: "Due" },
            { value: "random", label: "Random" },
            ]}
        />
        <PillTabs
            value={testMode}
            onChange={(v) => setTestMode(v as any)}
            items={[
            { value: "flashcard", label: "Flashcard" },
            { value: "type", label: "Type" },
            { value: "mcq", label: "Pick" },
            ]}
        />
        </div>

        <div style={{ marginTop: 14 }}>
        {(() => {
            if (!c) {
            return (
                <Card style={{ boxShadow: UI.shadow }}>
                <div style={{ color: UI.muted, lineHeight: "22px" }}>
                    {cards.length ? "Nothing due 🎉 Switch to Random?" : "No words saved yet."}
                </div>
                </Card>
            );
            }

            return (
            <Card style={{ boxShadow: UI.shadow }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 12, color: UI.muted, fontWeight: 750, letterSpacing: 0.4 }}>Word</div>
                    <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900, fontFamily: UI.fontSerif, letterSpacing: -0.4 }}>
                    {c.word}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Chip>{c.part_of_speech ?? "—"}</Chip>
                </div>
                </div>

                {/* Flashcard */}
                {testMode === "flashcard" && (
                <Flashcards
                    revealed={revealed}
                    curr={c}
                />
                )}

                {/* Type */}
                {testMode === "type" && (
                <Type
                    revealed={revealed}
                    curr={c}
                    typed={typed}
                    setTyped={setTyped}
                />
                )}

                {/* MCQ */}
                {testMode === "mcq" && (
                <MultipleChoice
                    mcqOptions={mcqOptions}
                    mcqChoiceId={mcqChoiceId}
                    mcqResult={mcqResult}
                    curr={c}
                    setMcqChoiceId={setMcqChoiceId}
                    setMcqResult={setMcqResult}
                    setRevealed={setRevealed}
                    mark={mark}
                />
                )}

                {/* Actions (non-MCQ) */}
                {testMode !== "mcq" && (
                <NonMultipleChoice
                    revealed={revealed}
                    setRevealed={setRevealed}
                    mark={mark}
                />
                )}

            </Card>
            );
        })()}
        </div>
    </section>)
    };