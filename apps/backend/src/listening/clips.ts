import type { ListeningClipSummary, TargetLanguage } from "@englishclass/types";

export interface ListeningClipRecord extends ListeningClipSummary {
  transcript: string;
}

// Imported after the interface so the Chinese catalog can reference it as a
// type-only import (erased at compile time, so there is no runtime cycle).
import { CHINESE_CLIPS } from "../chinese/clips";

// Stage 17: curated listening scripts. Same "curate the content, generate the
// varied part" split as reading (Stage 15): the transcript is authored for
// reliability and level-appropriateness, its audio is TTS-synthesized on the
// client (reusing the Stage 16 male/female voice selection), and the
// comprehension questions are AI-generated + cached. estimatedSeconds is a
// rough guide at ~2.5 words/second of speech.
const CLIPS: ListeningClipRecord[] = [
  {
    id: "listen-morning-routine",
    title: "A Morning Routine",
    cefrLevel: "A1",
    estimatedSeconds: 30,
    transcript:
      "I wake up at seven o'clock every morning. First, I brush my teeth and wash my face. " +
      "Then I eat breakfast with my family. I usually have eggs and orange juice. " +
      "After breakfast, I get dressed and walk to the bus stop. The bus comes at eight o'clock. " +
      "I like my mornings because they are calm and quiet.",
  },
  {
    id: "listen-weekend-plans",
    title: "Weekend Plans",
    cefrLevel: "A2",
    estimatedSeconds: 40,
    transcript:
      "This weekend, my friends and I are going to the mountains. We plan to leave early on " +
      "Saturday morning and drive for about two hours. When we arrive, we will hike to a " +
      "beautiful lake and have a picnic there. In the evening, we are going to stay at a small " +
      "cabin near the forest. On Sunday, we want to visit a local market before we drive home. " +
      "I am really looking forward to spending time outdoors with my friends.",
  },
  {
    id: "listen-office-meeting",
    title: "An Office Meeting",
    cefrLevel: "B1",
    estimatedSeconds: 50,
    transcript:
      "Good morning, everyone. Thank you for joining today's meeting. The main topic is our new " +
      "marketing campaign, which we plan to launch next month. First, our design team will present " +
      "the new logo and website. After that, we need to discuss the budget and decide how much to " +
      "spend on online advertising. I would also like everyone to share any concerns they have " +
      "about the timeline. Please remember that our goal is to reach more customers without " +
      "increasing our costs too much. Let's begin with the design presentation.",
  },
  {
    id: "listen-climate-report",
    title: "A Climate Report",
    cefrLevel: "B2",
    estimatedSeconds: 55,
    transcript:
      "Scientists have released a new report on the effects of climate change in coastal regions. " +
      "According to the report, sea levels have risen faster over the past decade than previously " +
      "predicted. This rise threatens millions of people who live near the coast, as flooding " +
      "becomes more frequent and severe. The researchers argue that governments must invest in " +
      "both prevention and adaptation. Prevention means reducing greenhouse gas emissions, while " +
      "adaptation involves building stronger sea walls and improving drainage systems. The report " +
      "concludes that acting now will be far less expensive than dealing with the consequences later.",
  },
];

export function listListeningClips(
  language: TargetLanguage = "english",
): ListeningClipSummary[] {
  const catalog = language === "chinese" ? CHINESE_CLIPS : CLIPS;
  return catalog.map(({ id, title, cefrLevel, estimatedSeconds, language: lang }) => ({
    id,
    title,
    cefrLevel,
    estimatedSeconds,
    language: lang,
  }));
}

export function getListeningClip(id: string): ListeningClipRecord | undefined {
  return CLIPS.find((clip) => clip.id === id) ?? CHINESE_CLIPS.find((clip) => clip.id === id);
}

/** Splits a transcript into sentences for sentence-by-sentence dictation mode.
 *
 * Stage 29: Chinese sentences end with full-width punctuation and are written
 * without spaces, so the English-only rule (terminator followed by whitespace)
 * would return the entire clip as a single "sentence". The first alternative
 * below splits directly after Chinese terminators; English behaviour is
 * unchanged because those characters never appear in English text. */
export function splitIntoSentences(transcript: string): string[] {
  return transcript
    .split(/(?<=[。！？])|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
