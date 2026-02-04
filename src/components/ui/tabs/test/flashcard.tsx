import {CardRow} from "@/app/type";
import {UI} from "@/app/styles/userinterfacestyle";


export function Flashcards({
    revealed,
    curr,
 }: {
    revealed: boolean;
    curr: CardRow;
 }) {
    return(
      <div style={{ marginTop: 14 }}>
         {!revealed ? (
            <div style={{ color: UI.muted }}>Tap reveal when you’re ready.</div>
                ) : (
                    <>
                    <div style={{ fontSize: 16, lineHeight: "24px" }}>{curr.definition}</div>
                    {curr.example ? (
                     <div style={{ marginTop: 10, color: UI.muted, fontStyle: "italic", lineHeight: "22px" }}>
                    
                    “{curr.example}”
                        </div>
                    ) : null}
            </>
         )}
    </div>)
  };