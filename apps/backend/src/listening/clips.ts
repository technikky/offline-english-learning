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
  // --- Stage 32: completing the top of the ladder (C1, C2) plus more at B1 ---
  {
    id: "listen-library-announcement",
    title: "A Library Announcement",
    cefrLevel: "B1",
    estimatedSeconds: 45,
    transcript:
      "Good afternoon, everyone. This is a short announcement from the library staff. " +
      "Please note that the second floor will be closed this Thursday and Friday while " +
      "new shelving is installed. All books normally kept upstairs have been moved to the " +
      "temporary section behind the main desk. If you cannot find what you need, please " +
      "ask a member of staff rather than searching on your own. Borrowing times are not " +
      "affected, and the study rooms on the ground floor remain open as usual. " +
      "Thank you for your patience.",
  },
  {
    id: "listen-research-interview",
    title: "An Interview With a Researcher",
    cefrLevel: "C1",
    estimatedSeconds: 70,
    transcript:
      "Interviewer: Your study looked at how people remember what they read on screens " +
      "compared with paper. What surprised you most? " +
      "Researcher: Honestly, how consistent the effect was. Across every age group we " +
      "tested, comprehension of longer arguments was slightly better on paper. " +
      "Interviewer: Why might that be? " +
      "Researcher: We think it's partly physical. A printed page gives you a stable sense " +
      "of where you are in a text, and that spatial memory seems to support recall. " +
      "Scrolling removes it. But I'd be cautious about concluding that screens are simply " +
      "worse. When we asked people to slow down and take notes, the difference largely " +
      "disappeared. The medium shapes how we read, and it's the reading behaviour, not the " +
      "device itself, that does most of the work.",
  },
  {
    id: "listen-conference-talk",
    title: "Opening of a Conference Talk",
    cefrLevel: "C2",
    estimatedSeconds: 85,
    transcript:
      "Thank you for that generous introduction, though I suspect it sets expectations " +
      "rather higher than I can meet. I want to begin with a confession: for the first ten " +
      "years of my career, I was almost certainly wrong about the central question I had " +
      "set out to answer. Not wrong in some trivial, correctable way, but wrong in my " +
      "framing of the problem itself. What I had treated as a technical shortcoming turned " +
      "out to be a question about incentives, and no amount of engineering was ever going " +
      "to resolve it. I mention this not out of false modesty, but because the field has a " +
      "tendency to present its history as a smooth accumulation of insight, when in " +
      "practice much of what we now regard as obvious was arrived at only after a long " +
      "detour. So what I would like to offer this afternoon is less a set of conclusions " +
      "than an account of where the detours were, and what, with hindsight, might have " +
      "shortened them.",
  }
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
