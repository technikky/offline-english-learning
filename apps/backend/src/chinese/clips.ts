import type { ListeningClipRecord } from "../listening/clips";

// Stage 29: curated Mandarin listening scripts, unlocked by vendoring the
// zh_CN-huayan Piper voice. Same "curate the script, synthesize the audio,
// AI-generate the questions" split as the English clips (Stage 17).
//
// estimatedSeconds is a rough guide at ~3.5 characters/second of natural
// Mandarin speech (Chinese is denser per character than English is per word).
//
// Ids are prefixed `zh-listen-` and globally unique across languages.

export const CHINESE_CLIPS: ListeningClipRecord[] = [
  {
    id: "zh-listen-introduction",
    language: "chinese",
    title: "自我介绍 (Introducing Yourself)",
    cefrLevel: "A1",
    estimatedSeconds: 25,
    transcript:
      "你好！我叫李明。我今年十五岁，是一名中学生。" +
      "我家有四口人：爸爸、妈妈、姐姐和我。" +
      "我喜欢打篮球，也喜欢听音乐。" +
      "我每天六点半起床，七点半去学校。很高兴认识你！",
  },
  {
    id: "zh-listen-directions",
    language: "chinese",
    title: "问路 (Asking for Directions)",
    cefrLevel: "A2",
    estimatedSeconds: 32,
    transcript:
      "请问，去火车站怎么走？" +
      "您一直往前走，到第二个路口往右拐。" +
      "走大概五分钟，就能看到一个很大的银行。火车站就在银行的对面。" +
      "如果您走累了，也可以坐公共汽车，三路车直接到火车站，只要两站。" +
      "太谢谢您了！不客气。",
  },
  {
    id: "zh-listen-spring-festival",
    language: "chinese",
    title: "春节 (Spring Festival)",
    cefrLevel: "B1",
    estimatedSeconds: 50,
    transcript:
      "春节是中国最重要的节日。" +
      "每年农历新年之前，很多人会从工作的城市回到老家，和家人团聚，" +
      "这就是为什么春运期间的火车票非常难买。" +
      "除夕那天晚上，全家人一起吃年夜饭，饺子和鱼是常见的菜。" +
      "鱼代表年年有余，所以通常不会全部吃完。" +
      "孩子们最喜欢的是收红包。" +
      "大年初一，人们会去亲戚朋友家拜年，互相说新年快乐。",
  },
];
