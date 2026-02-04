import {CardRow} from "@/app/type";
import {UI, Chip} from "@/app/styles/userinterfacestyle";
import {Button} from "@/app/styles/buttonstyle";

export function MultipleChoice({
    mcqOptions,
    mcqChoiceId,
    mcqResult,
    curr,
    setMcqChoiceId,
    setMcqResult,
    setRevealed,
    mark,
 }: {
    mcqOptions: CardRow[];
    mcqChoiceId: string | null;
    mcqResult: "correct" | "wrong" | null;
    curr: CardRow;
    setMcqChoiceId: (s: string) => void;
    setMcqResult: (s: "correct" | "wrong" | null) => void;
    setRevealed: (b: boolean) => void;
    mark: (b: boolean) => void
 }) {
    return (
    <div style={{ marginTop: 14 }}>
    <div style={{ color: UI.muted, marginBottom: 10 }}>Pick the correct definition:</div>

    <div style={{ display: "grid", gap: 10 }}>
    {mcqOptions.map((opt) => {
        const selected = mcqChoiceId === opt.id;
        const locked = mcqResult !== null;

        // Determine styling after submit
        const isCorrectOption = opt.id === curr.id;
        const showCorrect = locked && isCorrectOption;
        const showWrong = locked && selected && !isCorrectOption;

        let bg = "#fff";
        let border = UI.borderSoft;
        let color = UI.text;

        if (selected && !locked) {
        bg = "rgba(111, 143, 119, 0.10)";
        border = "rgba(111, 143, 119, 0.35)";
        }
        if (showCorrect) {
        bg = "rgba(46, 125, 87, 0.12)";
        border = "rgba(46, 125, 87, 0.35)";
        color = UI.text;
        }
        if (showWrong) {
        bg = "rgba(176, 68, 53, 0.10)";
        border = "rgba(176, 68, 53, 0.35)";
        color = UI.text;
        }

        return (
        <button
            key={opt.id}
            onClick={() => setMcqChoiceId(opt.id)}
            disabled={locked}
            style={{
            textAlign: "left",
            padding: 14,
            borderRadius: UI.radiusSm,
            border: `1px solid ${border}`,
            background: bg,
            color,
            cursor: locked ? "not-allowed" : "pointer",
            transition: "background 150ms ease, border-color 150ms ease, transform 120ms ease",
            boxShadow: "0 1px 0 rgba(43, 38, 34, 0.03)",
            opacity: locked && !selected && !isCorrectOption ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
            if (locked) return;
            const el = e.currentTarget as HTMLButtonElement;
            el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.transform = "translateY(0px)";
            }}
        >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ flex: 1, lineHeight: "22px" }}>{opt.definition}</div>
            {showCorrect ? <Chip>✓</Chip> : null}
            {showWrong ? <Chip>✕</Chip> : null}
            </div>
        </button>
        );
    })}
    </div>

    <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
    <Button
        variant="primary"
        disabled={!mcqChoiceId || mcqResult !== null}
        onClick={() => {
        if (!curr || !mcqChoiceId) return;
        const correct = mcqChoiceId === curr.id;
        setMcqResult(correct ? "correct" : "wrong");
        setRevealed(true);
        }}
    >
        Submit
    </Button>

    {mcqResult !== null ? (
        <Button
        variant="secondary"
        onClick={async () => {
            await mark(mcqResult === "correct");
        }}
        >
        Next
        </Button>
    ) : null}
    </div>

    {mcqResult === "correct" ? (
    <div style={{ marginTop: 12, color: UI.success, fontWeight: 800 }}>✔ Yes! Correct</div>
    ) : null}
    {mcqResult === "wrong" ? (
    <div style={{ marginTop: 12, color: UI.danger, fontWeight: 800 }}>
        ✘ Ah! Not quite
        <div style={{ marginTop: 6, color: UI.muted, fontWeight: 650 }}>
        Correct answer: <span style={{ color: UI.text, fontWeight: 800 }}>{curr.definition}</span>
        </div>
    </div>
    ) : null}
    </div>)
  };

  export function NonMultipleChoice({
      revealed,
      setRevealed,
      mark,
   }: {
      revealed: boolean;
      setRevealed: (b: boolean) => void;
      mark: (b: boolean) => Promise<void>;
   }) {
      return(
       <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <Button onClick={() => setRevealed(true)} disabled={revealed} variant="secondary">
        Reveal
        </Button>
        <Button onClick={() => mark(true)} disabled={!revealed} variant="primary">
        Knew it
        </Button>
        <Button onClick={() => mark(false)} disabled={!revealed} variant="ghost">
        Didn’t know
        </Button>
    </div>)
    };