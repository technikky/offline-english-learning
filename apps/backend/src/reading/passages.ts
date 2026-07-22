import type { ReadingPassageSummary, TargetLanguage } from "@englishclass/types";

export interface PassageRecord extends ReadingPassageSummary {
  content: string;
}

// Imported after the interface so the Chinese catalog can reference it as a
// type-only import (erased at compile time, so there's no runtime cycle).
import { CHINESE_PASSAGES } from "../chinese/passages";

// Stage 15: a curated set of reading passages, one per CEFR level. Curated
// for the same reason as the Stage 14 grammar curriculum -- reliable,
// level-appropriate reading material matters more than variety here. The
// AI is used instead for what varies naturally per passage: comprehension
// questions, a summary, and vocabulary highlights (see reading/comprehension.ts),
// generated once per passage and cached, not regenerated per read (unlike
// grammar practice exercises, which should vary each attempt).
const PASSAGES: PassageRecord[] = [
  {
    id: "a-day-at-the-park",
    title: "A Day at the Park",
    cefrLevel: "A1",
    estimatedReadingMinutes: 2,
    content:
      "Maria wakes up early on Saturday. The sun is bright. She eats breakfast with her family. " +
      "After breakfast, they walk to the park near their house. The park has a big green field and " +
      "many tall trees. Maria's little brother plays on the swings. Her father reads a book on a " +
      "bench. Her mother brings sandwiches and juice for lunch. They sit under a tree and eat " +
      "together. Maria sees a dog running with a ball. She laughs and claps her hands. In the " +
      "afternoon, the family walks home. Maria is happy. She loves Saturdays at the park.",
  },
  {
    id: "the-new-neighbor",
    title: "The New Neighbor",
    cefrLevel: "A2",
    estimatedReadingMinutes: 3,
    content:
      "Last week, a new family moved into the house next to ours. I saw them carrying boxes from a " +
      "big truck. There was a girl about my age, so I decided to say hello. Her name is Lucia, and " +
      "she just moved here from another city because of her mother's new job. At first, Lucia " +
      "seemed a little shy, but after we talked about our favorite music, she smiled a lot more. " +
      "I invited her to walk to school with me on Monday since we go to the same one. She said yes " +
      "right away. Now we walk together every morning and have become good friends. I'm glad I " +
      "didn't wait too long to introduce myself.",
  },
  {
    id: "working-from-home",
    title: "The Rise of Working From Home",
    cefrLevel: "B1",
    estimatedReadingMinutes: 4,
    content:
      "In recent years, more and more companies have allowed their employees to work from home " +
      "instead of commuting to an office every day. This change brings both benefits and " +
      "challenges. On one hand, employees save time and money by not traveling, and many report " +
      "feeling less stressed. On the other hand, some workers find it difficult to separate their " +
      "personal life from their work life when both happen in the same space. Managers have also " +
      "had to learn new ways of communicating with their teams, relying more on video calls and " +
      "instant messaging than face-to-face conversations. Despite the challenges, surveys suggest " +
      "that most employees who have tried working from home would prefer to continue doing so, at " +
      "least part of the time, even after the option to return to the office becomes available.",
  },
  {
    id: "the-power-of-habits",
    title: "The Power of Habits",
    cefrLevel: "B2",
    estimatedReadingMinutes: 5,
    content:
      "Psychologists have long been fascinated by the role habits play in shaping our daily lives. " +
      "A habit, broadly defined, is a behavior that has become automatic through repetition, " +
      "requiring little conscious thought to perform. Researchers estimate that a significant " +
      "portion of our daily actions, from brushing our teeth to choosing a route to work, are " +
      "governed by habitual patterns rather than deliberate decision-making. This automaticity " +
      "serves an important evolutionary purpose: by freeing up mental resources for more complex " +
      "tasks, habits allow us to navigate routine situations efficiently. However, this same " +
      "mechanism can work against us when the habits in question are unhealthy or unproductive. " +
      "Breaking an established habit typically requires more than willpower alone; it often " +
      "involves identifying the specific cue that triggers the behavior and consciously " +
      "substituting a new response in its place, a process that can take weeks or months to " +
      "become automatic itself.",
  },
  {
    id: "the-ethics-of-artificial-intelligence",
    title: "The Ethics of Artificial Intelligence",
    cefrLevel: "C1",
    estimatedReadingMinutes: 6,
    content:
      "As artificial intelligence systems become increasingly embedded in decisions that affect " +
      "people's lives, from loan approvals to medical diagnoses, the ethical implications of their " +
      "deployment have moved from an academic curiosity to a pressing societal concern. One of the " +
      "central difficulties lies in the opacity of many modern machine learning models: even their " +
      "own developers often cannot fully explain why a particular input produced a particular " +
      "output, a problem commonly referred to as the 'black box' issue. This lack of " +
      "interpretability becomes especially fraught when a system's decisions carry legal or moral " +
      "weight, raising the question of whether an institution can be held accountable for a " +
      "decision it cannot fully justify. Compounding this challenge is the well-documented tendency " +
      "of AI systems to inherit and, in some cases, amplify biases present in their training data, " +
      "meaning that a model designed with no explicit discriminatory intent can nonetheless produce " +
      "systematically unequal outcomes across demographic groups. Addressing these concerns will " +
      "likely require not a single technical fix, but an ongoing collaboration between engineers, " +
      "ethicists, and policymakers.",
  },
];

// Stage 28: passages for the language the student is learning. As with grammar
// topics, ids are globally unique across languages, so lookups search every
// catalog and only listing filters.
export function listReadingPassages(
  language: TargetLanguage = "english",
): ReadingPassageSummary[] {
  const catalog = language === "chinese" ? CHINESE_PASSAGES : PASSAGES;
  return catalog.map(({ id, title, cefrLevel, estimatedReadingMinutes, language: lang }) => ({
    id,
    title,
    cefrLevel,
    estimatedReadingMinutes,
    language: lang,
  }));
}

export function getReadingPassage(id: string): PassageRecord | undefined {
  return (
    PASSAGES.find((passage) => passage.id === id) ??
    CHINESE_PASSAGES.find((passage) => passage.id === id)
  );
}
