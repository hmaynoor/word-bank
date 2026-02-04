import {CardRow} from "@/app/type";
import {UI} from "@/app/styles/userinterfacestyle";
import { Textarea } from "@/app/styles/textAreaStyle";


export function Type({
    revealed,
    curr,
    typed,
    setTyped,
 }: {
    revealed: boolean;
    curr: CardRow,
    typed: string;
    setTyped: (s: string) => void;
 }) {
    return(
      <div style={{ marginTop: 14 }}>
      <div style={{ color: UI.muted, marginBottom: 8 }}>Type what you think it means (rough is fine):</div>
      <Textarea rows={3} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Your definition…" />
            {revealed ? (
                <>
                <div style={{ marginTop: 12, fontWeight: 800 }}>Saved definition</div>
                <div style={{ marginTop: 6, lineHeight: "24px" }}>{curr.definition}</div>
                </>
            ) : null}
        </div>)
  };