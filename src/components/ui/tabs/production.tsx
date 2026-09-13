import React, { useState } from "react";
import { CardRow } from "@/app/type";
import { UI, Card } from "@/app/styles/userinterfacestyle";
import { Button } from "@/app/styles/buttonstyle";
import { Textarea } from "@/app/styles/textAreaStyle";
import { Chip } from "@/app/styles/userinterfacestyle";

type ProductionTabProps = {
  currentCard: CardRow | null;
  cards: CardRow[];
  onNextWord: () => void;
  status?: string;
};

export const ProductionTab = ({
  currentCard,
  cards,
  onNextWord,
  status,
}: ProductionTabProps) => {
  const [sentence, setSentence] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);

  // Auto-pick a card if none is provided
  React.useEffect(() => {
    if (!currentCard && cards.length > 0) {
      onNextWord();
    }
  }, [currentCard, cards.length]);

  async function handleSubmit() {
    if (!currentCard || !sentence.trim()) return;

    setLoading(true);
    setFeedback(null);
    setShowDefinition(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-sentence-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            word: currentCard.word,
            definition: currentCard.definition,
            sentence: sentence.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get feedback");
      }

      const data = await response.json();
      setFeedback(data.feedback);
      setShowDefinition(true);
    } catch (error) {
      setFeedback(
        "Error getting feedback. Please try again. " +
          (error instanceof Error ? error.message : "")
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    setSentence("");
    setFeedback(null);
    setShowDefinition(false);
    onNextWord();
  }

  if (!currentCard) {
    return (
      <div style={{ marginTop: 20 }}>
        <Card>
          <div style={{ textAlign: "center", color: UI.muted }}>
            No words available yet. Add some words to get started!
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
      {/* Word Prompt */}
      <Card style={{ marginBottom: 16, textAlign: "center", padding: 32 }}>
        <div
          style={{
            fontSize: 12,
            color: UI.muted,
            fontWeight: 750,
            letterSpacing: 0.4,
            marginBottom: 8,
          }}
        >
          Write a sentence using:
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 850,
            fontFamily: UI.fontSerif,
            letterSpacing: -0.8,
            color: UI.sage,
          }}
        >
          {currentCard.word}
        </div>
        {currentCard.part_of_speech && (
          <div style={{ marginTop: 8 }}>
            <Chip>{currentCard.part_of_speech}</Chip>
          </div>
        )}
      </Card>

      {/* Input Area */}
      {!feedback ? (
        <Card style={{ marginBottom: 16 }}>
          <Textarea
            placeholder="Write your sentence here…"
            rows={4}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            disabled={loading}
          />
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <Button
              onClick={handleSubmit}
              disabled={loading || !sentence.trim()}
              style={{ flex: 1 }}
            >
              {loading ? "Getting feedback…" : "Submit"}
            </Button>
            <Button
              onClick={handleNext}
              variant="ghost"
              disabled={loading}
            >
              Skip
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Feedback Card */}
          <Card style={{ marginBottom: 16, background: "rgba(111, 143, 119, 0.05)", borderColor: "rgba(111, 143, 119, 0.2)" }}>
            <div
              style={{
                fontSize: 12,
                color: UI.muted,
                fontWeight: 750,
                letterSpacing: 0.4,
                marginBottom: 8,
              }}
            >
              Feedback
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: "20px",
                color: UI.text,
                whiteSpace: "pre-wrap",
              }}
            >
              {feedback}
            </div>

            {/* Definition (shown after feedback) */}
            {showDefinition && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${UI.borderSoft}` }}>
                <div
                  style={{
                    fontSize: 12,
                    color: UI.muted,
                    fontWeight: 750,
                    letterSpacing: 0.4,
                    marginBottom: 6,
                  }}
                >
                  Definition
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: "20px",
                    color: UI.text,
                  }}
                >
                  {currentCard.definition}
                </div>
                {currentCard.example && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: UI.muted,
                        fontWeight: 750,
                        letterSpacing: 0.4,
                        marginBottom: 4,
                      }}
                    >
                      Example
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: "18px",
                        color: UI.muted,
                        fontStyle: "italic",
                      }}
                    >
                      {currentCard.example}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Next Button */}
          <Button onClick={handleNext} style={{ width: "100%" }}>
            Next Word
          </Button>
        </>
      )}

      {status && (
        <div
          style={{
            marginTop: 12,
            color: UI.muted,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
};