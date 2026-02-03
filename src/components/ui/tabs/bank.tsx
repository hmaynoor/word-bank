import {CardRow, Meaning} from "@/app/type";
import {UI, Card, Chip} from "@/app/styles/userinterfacestyle";
import {Button} from "@/app/styles/buttonstyle";

 export function BankTab({
    word, 
    setWord,
    cards,
    startEdit,
    deleteCard,
 }: {
    word: string;
    setWord: (s: string) => void;
    cards: CardRow[];
    startEdit: (c: CardRow) => void;
    deleteCard: (id: string) => void;
 }) {
     return(
        
     
     <section style={{ marginTop: 18, display: "grid", gap: 12 }}>
          {cards.map((c) => (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: UI.fontSerif }}>{c.word}</div>
                  <div style={{ marginTop: 8 }}>
                    <Chip>{c.part_of_speech ?? "—"}</Chip>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Button onClick={() => startEdit(c)} variant="ghost">
                    Edit
                  </Button>
                  <Button onClick={() => deleteCard(c.id)} variant="danger">
                    Delete
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: 12, lineHeight: "24px" }}>{c.definition}</div>

              {c.example ? (
                <div style={{ marginTop: 10, color: UI.muted, fontStyle: "italic", lineHeight: "22px" }}>
                  “{c.example}”
                </div>
              ) : null}
            </Card>
          ))}
        </section>)
  };
