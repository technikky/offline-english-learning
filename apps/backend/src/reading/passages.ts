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
  // --- Stage 32: a second passage at every level, plus the first C2 text ---
  {
    id: "the-lost-key",
    title: "The Lost Key",
    cefrLevel: "A1",
    estimatedReadingMinutes: 2,
    content:
      "Tom comes home from school. He puts his hand in his pocket. His key is not there. He looks " +
      "in his bag. It is not there. Tom is worried. He sits on the step and thinks. Where was he " +
      "today? He was at school. He was at the shop. He was in the park. Tom walks back to the " +
      "park. He looks under the bench. He sees something small and silver in the grass. It is his " +
      "key! Tom is very happy. He runs home and opens the door.",
  },
  {
    id: "the-morning-market",
    title: "The Morning Market",
    cefrLevel: "A2",
    estimatedReadingMinutes: 3,
    content:
      "Every Saturday morning, my grandmother takes me to the market near the river. We always " +
      "leave early, because she says the best vegetables are gone by nine o'clock. The market is " +
      "noisy and full of colour. There are boxes of oranges, tomatoes and green beans, and a man " +
      "who sells fresh bread from the back of his van. My grandmother knows almost everyone. She " +
      "stops to talk to the woman who sells eggs, and they discuss the weather for ten minutes. I " +
      "usually get bored, so she gives me some coins to buy something for myself. Last week I " +
      "bought a small plant for my bedroom window. When we get home, we make lunch together with " +
      "everything we bought.",
  },
  {
    id: "learning-to-cook",
    title: "Learning to Cook",
    cefrLevel: "B1",
    estimatedReadingMinutes: 4,
    content:
      "When I moved out of my parents' house, I could not cook anything. For the first month I " +
      "lived on sandwiches and instant noodles, and I told myself that cooking was too " +
      "complicated to learn. Then a friend showed me how to make a simple tomato pasta. It took " +
      "fifteen minutes and it tasted better than anything I had bought that month. That small " +
      "success changed my attitude completely. I started with three basic dishes and cooked them " +
      "again and again until I did not need to look at the recipe. Only then did I add something " +
      "new. Two years later, I cook almost every evening, and friends ask me for recipes. What I " +
      "learned was not really about food: if you want to build a skill, start with something " +
      "small enough that you will actually finish it.",
  },
  {
    id: "the-value-of-boredom",
    title: "The Value of Boredom",
    cefrLevel: "B2",
    estimatedReadingMinutes: 5,
    content:
      "Boredom has a bad reputation. We treat it as a problem to be solved, and we now carry the " +
      "solution in our pockets: the moment a queue forms or a train is delayed, the phone comes " +
      "out. Yet psychologists have begun to argue that we may be losing something valuable. " +
      "Boredom, they suggest, is not empty time but a signal — an uncomfortable prompt that our " +
      "current activity is not meaningful, which pushes the mind to search for something better. " +
      "Studies have found that people who are given a dull task before a creative one generate " +
      "more original ideas than those who are entertained beforehand. The explanation offered is " +
      "that an unoccupied mind begins to wander, and a wandering mind makes connections between " +
      "ideas that would otherwise stay separate. This does not mean we should seek out tedium. " +
      "It does suggest, however, that filling every spare second may come at a cost we have not " +
      "properly counted.",
  },
  {
    id: "the-language-of-machines",
    title: "The Language of Machines",
    cefrLevel: "C1",
    estimatedReadingMinutes: 6,
    content:
      "For most of computing history, communicating with a machine meant learning its language. " +
      "Programmers memorised rigid syntax in which a misplaced semicolon could bring an entire " +
      "system down, and ordinary users navigated menus designed around what was easy to build " +
      "rather than what was natural to ask. That relationship has begun to reverse. Systems that " +
      "process ordinary language now allow a user to describe an intention rather than specify a " +
      "procedure, and the machine attempts to infer the steps. The appeal is obvious, but the " +
      "shift introduces a subtler difficulty. Formal languages are unambiguous by design: a " +
      "command means exactly one thing, and when it fails, it fails visibly. Natural language is " +
      "the opposite. It is rich precisely because it is ambiguous, dependent on shared context " +
      "and willing to leave a great deal unsaid. A system that accepts vague instructions will " +
      "sometimes produce confident, fluent answers that are quietly wrong — and, unlike a syntax " +
      "error, nothing announces the failure. What we gain in accessibility we may pay for in " +
      "verifiability, and learning to notice that trade-off is fast becoming a basic literacy.",
  },
  {
    id: "the-paradox-of-choice",
    title: "The Paradox of Choice",
    cefrLevel: "C2",
    estimatedReadingMinutes: 7,
    content:
      "It is almost an article of faith in market economies that more choice is straightforwardly " +
      "better. Expand the range of options available to an individual, the reasoning goes, and " +
      "you expand their freedom; whatever they select will fit their preferences more closely " +
      "than it would have under a narrower menu. The logic is elegant, and for a long time it " +
      "went largely unexamined. What complicated it was a body of research suggesting that, past " +
      "a certain point, additional options make people measurably worse off. In one well-known " +
      "study, shoppers offered a small selection of jams were markedly more likely to buy than " +
      "those confronted with an extensive display — and reported greater satisfaction with what " +
      "they had chosen. Not only were the many-option shoppers less decisive; they were also more " +
      "prone to regret afterwards. Two mechanisms are usually invoked. The first is cognitive: " +
      "comparing dozens of alternatives is effortful, and beyond a certain threshold the effort " +
      "outweighs any marginal gain in fit. The second is emotional. Where alternatives are " +
      "plentiful, every choice carries an implicit cost — the excellent option not taken — and " +
      "responsibility for a disappointing outcome rests squarely with the chooser. Rarely is the " +
      "conclusion that choice should be restricted. What the findings do suggest is that " +
      "abundance is not costless, and that curation, far from limiting freedom, may be what makes " +
      "it usable.",
  }
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
