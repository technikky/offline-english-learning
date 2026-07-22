import type { WritingPromptDetail } from "@englishclass/types";

// Stage 31: curated Mandarin writing prompts, the Chinese counterpart to
// writing/prompts.ts. Same scaffolding principle (topic, target vocabulary,
// grammar focus, length target, hints) rather than a bare blank page.
//
// `wordCountTarget` is a **character** count for Chinese (字数), which is how
// Chinese writing length is conventionally measured -- see countWritingUnits()
// in writing/prompts.ts. The targets are deliberately smaller than the English
// ones because a Chinese character carries more than an English word does.
//
// Target vocabulary is given as 汉字 with pinyin and a gloss so a learner can
// actually use the words without looking every one up.
//
// Ids are prefixed `zh-write-` and globally unique across languages.

export const CHINESE_WRITING_PROMPTS: WritingPromptDetail[] = [
  {
    id: "zh-write-my-family",
    language: "chinese",
    title: "我的家 (My Family)",
    cefrLevel: "A1",
    wordCountTarget: 60,
    prompt:
      "写一段话介绍你的家人。你家有几口人？他们做什么工作？你们喜欢一起做什么？" +
      "(Write a short paragraph introducing your family. How many people are in your family? " +
      "What do they do? What do you like doing together?)",
    targetVocabulary: [
      "家 (jiā) — family/home",
      "爸爸 (bàba) — father",
      "妈妈 (māma) — mother",
      "工作 (gōngzuò) — work",
      "喜欢 (xǐhuān) — to like",
      "一起 (yìqǐ) — together",
    ],
    grammarFocus: "Basic 主谓宾 sentence order, 有 for 'to have', and measure word 口 for family members",
    hints: [
      "开头可以写：我家有…口人。(Start with: 我家有…口人。)",
      "每个人写一句话，说他们做什么。(Write one sentence per person, saying what they do.)",
      "最后写一件你们一起做的事。(End with one thing you do together.)",
    ],
  },
  {
    id: "zh-write-my-weekend",
    language: "chinese",
    title: "我的周末 (My Weekend)",
    cefrLevel: "A2",
    wordCountTarget: 100,
    prompt:
      "写一写你上个周末做了什么。你去了哪里？和谁一起？你觉得怎么样？" +
      "(Write about what you did last weekend. Where did you go? Who with? How did you feel?)",
    targetVocabulary: [
      "周末 (zhōumò) — weekend",
      "去 (qù) — to go",
      "朋友 (péngyǒu) — friend",
      "买 (mǎi) — to buy",
      "然后 (ránhòu) — then",
      "开心 (kāixīn) — happy",
    ],
    grammarFocus: "The particle 了 for completed actions, and time words placed before the verb",
    hints: [
      "用「上个周末」开头。(Begin with 上个周末.)",
      "用「先…然后…」把事情按顺序写。(Use 先…然后… to order events.)",
      "记住：时间词放在动词前面。(Remember: time words come before the verb.)",
    ],
  },
  {
    id: "zh-write-my-city",
    language: "chinese",
    title: "我住的城市 (The City I Live In)",
    cefrLevel: "B1",
    wordCountTarget: 160,
    prompt:
      "介绍你住的城市或者村子。那里有什么？和别的地方比，有什么特别的？你喜欢那里吗？为什么？" +
      "(Describe the city or town where you live. What is there? What makes it different from other " +
      "places? Do you like it, and why?)",
    targetVocabulary: [
      "城市 (chéngshì) — city",
      "交通 (jiāotōng) — transport",
      "方便 (fāngbiàn) — convenient",
      "热闹 (rènào) — lively/bustling",
      "环境 (huánjìng) — environment",
      "虽然…但是… (suīrán…dànshì…) — although…, …",
    ],
    grammarFocus: "Comparisons with 比, and the 虽然…但是… construction for contrast",
    hints: [
      "先写这个地方在哪里，有多大。(Say where it is and how big.)",
      "用「比」比较你的城市和别的地方。(Use 比 to compare it with somewhere else.)",
      "用「虽然…但是…」写一个优点和一个缺点。(Use 虽然…但是… for one good and one bad point.)",
    ],
  },
  {
    id: "zh-write-learning-opinion",
    language: "chinese",
    title: "学外语的看法 (Views on Learning a Foreign Language)",
    cefrLevel: "B2",
    wordCountTarget: 250,
    prompt:
      "有人说学外语最重要的是多说，也有人说应该先打好语法基础。你同意哪种看法？请说明你的理由，" +
      "并举例子。(Some say the most important thing in learning a language is speaking a lot; others " +
      "say you should build a grammar foundation first. Which view do you agree with? Give your " +
      "reasons with examples.)",
    targetVocabulary: [
      "看法 (kànfǎ) — view/opinion",
      "基础 (jīchǔ) — foundation",
      "坚持 (jiānchí) — to persevere",
      "效果 (xiàoguǒ) — effect/result",
      "不但…而且… (búdàn…érqiě…) — not only…, but also…",
      "总之 (zǒngzhī) — in short",
    ],
    grammarFocus:
      "Degree complements with 得, the 把 construction, and connectors (不但…而且…, 因此, 总之)",
    hints: [
      "第一段说清楚你的观点。(State your position in the first paragraph.)",
      "用两个理由支持它，每个理由举一个例子。(Give two reasons, each with an example.)",
      "最后用「总之」做一个简短的结论。(Conclude briefly with 总之.)",
    ],
  },
];
