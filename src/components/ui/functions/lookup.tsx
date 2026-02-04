import { Meaning } from "@/app/type";

export async function lookupWord(word: string): Promise<Meaning[]> {
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

  const seen = new Set<string>();
  return meanings.filter((m) => {
    const key = `${m.partOfSpeech ?? ""}::${m.definition}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

 export async function doLookup({
  setStatus,
  word,
  setMeanings,
 }: {
  setStatus: (s: string) => void;
  word: string;
  setMeanings: (m: Meaning[]) => void;
 }) {
    setStatus("Looking up…");
    const m = await lookupWord(word);
    setMeanings(m);
    setStatus(m.length ? `Found ${m.length}` : "No results");
  }