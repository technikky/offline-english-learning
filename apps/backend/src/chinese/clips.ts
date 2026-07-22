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
  {
    id: "zh-listen-recycling",
    language: "chinese",
    title: "垃圾分类 (Waste Sorting)",
    cefrLevel: "B2",
    estimatedSeconds: 60,
    transcript:
      "最近几年，越来越多的城市开始推广垃圾分类。" +
      "政府希望通过这个办法减少垃圾的数量，保护环境。" +
      "刚开始的时候，很多居民觉得很麻烦，也不知道哪些是可回收垃圾，哪些是厨余垃圾。" +
      "为了帮助大家，社区安排了志愿者在垃圾站旁边指导。" +
      "经过一段时间的努力，情况有了明显的改善。" +
      "专家表示，垃圾分类不但能节约资源，而且能减少对土地和水的污染。" +
      "不过他们也提醒，要真正解决问题，最重要的还是从源头上减少浪费。",
  },
  // Stage 35: HSK 5-6 clips. Denser and far more formal in register than the
  // HSK 1-4 set: an interview with real turn-taking, and an academic opening.
  {
    id: "zh-listen-city-interview",
    language: "chinese",
    title: "城市交通访谈 (An Interview on Urban Transport)",
    cefrLevel: "C1",
    estimatedSeconds: 75,
    transcript:
      "主持人：这几年很多城市都在限制私家车，效果究竟如何？" +
      "专家：从数据上看，高峰期的拥堵确实有所缓解，但幅度没有大家想象的那么大。" +
      "主持人：这是为什么呢？" +
      "专家：因为交通需求会自己调整。路一旦通畅，原本改坐地铁的人又会开回来，" +
      "最后重新回到原来的拥堵水平。" +
      "主持人：那您认为应该怎么办？" +
      "专家：单靠限制很难解决问题。关键在于让公共交通足够方便，" +
      "使人们自愿选择它，而不是被迫接受。" +
      "换句话说，与其堵住一条路，不如打开另一条。",
  },
  {
    id: "zh-listen-lecture-opening",
    language: "chinese",
    title: "讲座开场 (Opening of a Lecture)",
    cefrLevel: "C2",
    estimatedSeconds: 90,
    transcript:
      "各位下午好，感谢主办方的邀请。" +
      "在正式开始之前，我想先说明一点：今天要讲的内容，并没有一个干净利落的结论。" +
      "过去二十年里，我和同事们反复研究这个题目，" +
      "得到的结果与其说是答案，不如说是一系列越来越精确的问题。" +
      "我之所以强调这一点，是因为学术报告往往给人一种错觉，" +
      "仿佛研究是一条笔直向前的路；而事实上，其中大部分时间都花在了绕路和退回上。" +
      "因此，今天的报告我会分成三个部分：" +
      "首先介绍这一领域公认的基本事实，" +
      "其次说明哪些看似确定的结论其实并不牢靠，" +
      "最后谈谈在现有条件下，我们究竟还能做些什么。",
  }
];
