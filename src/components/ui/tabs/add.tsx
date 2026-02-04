import {Meaning} from "@/app/type";
import {UI, Card, Chip} from "@/app/styles/userinterfacestyle";
import {Button} from "@/app/styles/buttonstyle";
import {Input} from "@/app/styles/inputStyle";
import { doLookup } from "../functions/lookup";

 export function AddTab({
    word,
    setWord,
    setStatus,
    setMeanings,
    meanings,
    saveMeaning,
 }: {
    word: string,
    setWord: (w: string) => void,
    setStatus: (s: string) => void;
    setMeanings: (m: Meaning[]) => void;
    meanings: Meaning[];
    saveMeaning: (m: Meaning) => void;
 }) {
    return(
    <section style={{ marginTop: 18 }}>
    <Card style={{ boxShadow: UI.shadow }}>
     
    <div style={{ marginBottom: 14, color: UI.muted, fontSize: 13 }}>
        Lookup a word to find its definition.
    </div>
     
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
    <Input 
        value={word} 
        onChange={(e) => setWord(e.target.value)} 
        placeholder="e.g., specious" 
        style={{ flex: 1, minWidth: 240 }} />
    
    <Button onClick={()=>doLookup({setStatus, word, setMeanings})} disabled={!word.trim()} variant="primary">
        Lookup
    </Button>
    </div>
    </Card>
     
    <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
    {meanings.map((m, idx) => (
        <Card key={idx}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Chip>{m.partOfSpeech ?? "—"}</Chip>
             
            </div>
                <Button onClick={() => saveMeaning(m)} variant="secondary">
                    Save
                </Button>
            </div>
     
             <div style={{ marginTop: 10, fontSize: 16, lineHeight: "24px" }}>{m.definition}</div>
     
            {m.example ? (
                <div style={{ marginTop: 10, color: UI.muted, fontStyle: "italic", lineHeight: "22px" }}>“{m.example}”</div>
            ) : null}
     
            {m.synonyms?.length ? (
                <div style={{ marginTop: 10, color: UI.muted, fontSize: 13, lineHeight: "18px" }}>
                    Synonyms: {m.synonyms.slice(0, 6).join(", ")}
                 </div>
            ) : null}
        
        </Card>
        ))}
    </div>
    </section>)
  };