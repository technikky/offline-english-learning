import type { GrammarTopicDetail } from "@englishclass/types";

// Stage 28: curated Mandarin Chinese grammar curriculum, the Chinese
// counterpart to grammar/curriculum.ts. Same rationale as the English one:
// foundational lesson content is authored rather than AI-generated so it stays
// reliable and consistent; the AI is still used for per-attempt practice
// exercises (Qwen is a Chinese-native model, so it handles these well).
//
// Levels use CEFR internally like everything else in the platform -- the UI
// labels them HSK 1-6 for Chinese learners (see HSK_LABELS in the types
// package). Every example carries pinyin and an English gloss inline, so no
// extra rendering support is needed.
//
// Ids are prefixed `zh-` and are globally unique across languages, which lets
// lookups stay language-agnostic (only *listing* filters by language).

export const CHINESE_GRAMMAR_TOPICS: GrammarTopicDetail[] = [
  {
    id: "zh-basic-sentence",
    language: "chinese",
    level: "beginner",
    cefrLevel: "A1",
    title: "Basic Sentence Order (主谓宾)",
    explanation:
      "Chinese basic word order is Subject-Verb-Object, the same as English. The big " +
      "difference: verbs never change form. There are no tense endings, no plural " +
      "agreement, and no 'to be' before an adjective. Time words go near the start of " +
      "the sentence, not the end.",
    examples: [
      "我喝茶。(Wǒ hē chá.) — I drink tea.",
      "他吃饭。(Tā chī fàn.) — He eats.",
      "我们学中文。(Wǒmen xué Zhōngwén.) — We study Chinese.",
      "她看书。(Tā kàn shū.) — She reads a book.",
      "我今天很忙。(Wǒ jīntiān hěn máng.) — I am very busy today.",
    ],
  },
  {
    id: "zh-questions-ma",
    language: "chinese",
    level: "beginner",
    cefrLevel: "A1",
    title: "Yes/No Questions with 吗",
    explanation:
      "To turn a statement into a yes/no question, simply add 吗 (ma) to the end. The " +
      "word order does not change at all — there is no equivalent of English 'do/does' " +
      "inversion. To answer, repeat the verb for 'yes' (是 / 有 / 喜欢) or put 不 or 没 " +
      "before it for 'no'.",
    examples: [
      "你好吗？(Nǐ hǎo ma?) — How are you?",
      "你是学生吗？(Nǐ shì xuéshēng ma?) — Are you a student?",
      "他喝茶吗？(Tā hē chá ma?) — Does he drink tea?",
      "你有时间吗？(Nǐ yǒu shíjiān ma?) — Do you have time?",
      "这是你的书吗？(Zhè shì nǐ de shū ma?) — Is this your book?",
    ],
  },
  {
    id: "zh-measure-words",
    language: "chinese",
    level: "beginner",
    cefrLevel: "A2",
    title: "Measure Words (量词)",
    explanation:
      "You cannot put a number directly before a noun in Chinese. A measure word must " +
      "sit between them: Number + Measure Word + Noun. 个 (gè) is the general-purpose " +
      "one and works when you are unsure, but many nouns have their own. Note that 二 " +
      "becomes 两 (liǎng) before a measure word.",
    examples: [
      "一个人 (yí gè rén) — one person",
      "三本书 (sān běn shū) — three books",
      "两杯咖啡 (liǎng bēi kāfēi) — two cups of coffee",
      "五只猫 (wǔ zhī māo) — five cats",
      "一件衣服 (yí jiàn yīfu) — one piece of clothing",
    ],
  },
  {
    id: "zh-le-particle",
    language: "chinese",
    level: "beginner",
    cefrLevel: "A2",
    title: "The Particle 了",
    explanation:
      "了 is not a past tense — Chinese has no tense. After a verb it marks a completed " +
      "action; at the end of a sentence it marks a change of state ('now it is like " +
      "this'). Negate a completed action with 没(有) and drop 了 entirely.",
    examples: [
      "我吃了饭。(Wǒ chī le fàn.) — I have eaten.",
      "他走了。(Tā zǒu le.) — He has left.",
      "我买了三本书。(Wǒ mǎi le sān běn shū.) — I bought three books.",
      "下雨了。(Xià yǔ le.) — It's raining now. (change of state)",
      "我没吃饭。(Wǒ méi chī fàn.) — I didn't eat. (no 了)",
    ],
  },
  {
    id: "zh-ba-construction",
    language: "chinese",
    level: "intermediate",
    cefrLevel: "B1",
    title: "The 把 Construction",
    explanation:
      "把 moves the object in front of the verb to stress what was done TO it. The " +
      "pattern is Subject + 把 + Object + Verb + result. The verb must have something " +
      "after it (a result, 了, or a direction) — a bare verb is not allowed. The object " +
      "must be specific, not just 'a book' in general.",
    examples: [
      "我把门关了。(Wǒ bǎ mén guān le.) — I closed the door.",
      "他把书放在桌子上。(Tā bǎ shū fàng zài zhuōzi shàng.) — He put the book on the table.",
      "请把窗户打开。(Qǐng bǎ chuānghu dǎkāi.) — Please open the window.",
      "我把作业做完了。(Wǒ bǎ zuòyè zuò wán le.) — I finished the homework.",
      "她把钱包丢了。(Tā bǎ qiánbāo diū le.) — She lost her wallet.",
    ],
  },
  {
    id: "zh-comparisons-bi",
    language: "chinese",
    level: "intermediate",
    cefrLevel: "B1",
    title: "Comparisons with 比",
    explanation:
      "Use A + 比 + B + adjective to compare. Crucially, do NOT put 很 before the " +
      "adjective in a 比 sentence — 我比他很高 is wrong. To say by how much, put the " +
      "amount after the adjective. For 'not as ... as', use 没有 instead of 比.",
    examples: [
      "我比他高。(Wǒ bǐ tā gāo.) — I am taller than him.",
      "今天比昨天冷。(Jīntiān bǐ zuótiān lěng.) — Today is colder than yesterday.",
      "他比我大三岁。(Tā bǐ wǒ dà sān suì.) — He is three years older than me.",
      "坐地铁比开车快。(Zuò dìtiě bǐ kāichē kuài.) — Taking the subway is faster than driving.",
      "我没有他高。(Wǒ méiyǒu tā gāo.) — I am not as tall as him.",
    ],
  },
  {
    id: "zh-complement-degree",
    language: "chinese",
    level: "advanced",
    cefrLevel: "B2",
    title: "Degree Complements with 得",
    explanation:
      "Verb + 得 + adjective says how well an action is performed. If the verb takes an " +
      "object, repeat the verb: 他写汉字写得很漂亮. Note 得 (de) here is a different " +
      "character from possessive 的 and from adverbial 地.",
    examples: [
      "他说得很好。(Tā shuō de hěn hǎo.) — He speaks very well.",
      "你来得太早了。(Nǐ lái de tài zǎo le.) — You came too early.",
      "她跑得很快。(Tā pǎo de hěn kuài.) — She runs very fast.",
      "我睡得不好。(Wǒ shuì de bù hǎo.) — I didn't sleep well.",
      "他写汉字写得很漂亮。(Tā xiě hànzì xiě de hěn piàoliang.) — He writes characters beautifully.",
    ],
  },
];
