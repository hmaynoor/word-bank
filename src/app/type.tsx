
export type CardRow = {
  id: string;
  word: string;
  part_of_speech: string | null;
  definition: string;
  example: string | null;
  synonyms: any | null;
  due_at: string;
  correct_streak: number;
};

export type Meaning = {
  partOfSpeech?: string;
  definition: string;
  example?: string;
  synonyms?: string[];
};

