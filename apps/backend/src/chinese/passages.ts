import type { PassageRecord } from "../reading/passages";

// Stage 28: curated Mandarin Chinese reading passages, the Chinese counterpart
// to reading/passages.ts. Each carries full pinyin and an English translation,
// which the reader reveals with toggles -- essential scaffolding for Chinese,
// where a learner who can't yet read a character is otherwise stuck.
//
// Comprehension questions are still AI-generated and cached per passage, the
// same as English (Qwen handles Chinese natively).
//
// Ids are prefixed `zh-read-` and globally unique across languages.

export const CHINESE_PASSAGES: PassageRecord[] = [
  {
    id: "zh-read-my-day",
    language: "chinese",
    title: "我的一天 (My Day)",
    cefrLevel: "A1",
    estimatedReadingMinutes: 2,
    content:
      "我每天七点起床。我先刷牙，然后吃早饭。我喜欢喝牛奶，也喜欢吃鸡蛋。" +
      "八点，我去学校。我坐公共汽车，路上要二十分钟。中午我和朋友一起吃午饭。" +
      "下午我们上课。四点我回家。晚上我做作业，然后看电视。十点我睡觉。",
    pinyin:
      "Wǒ měitiān qī diǎn qǐchuáng. Wǒ xiān shuāyá, ránhòu chī zǎofàn. Wǒ xǐhuān hē " +
      "niúnǎi, yě xǐhuān chī jīdàn. Bā diǎn, wǒ qù xuéxiào. Wǒ zuò gōnggòng qìchē, " +
      "lùshàng yào èrshí fēnzhōng. Zhōngwǔ wǒ hé péngyǒu yìqǐ chī wǔfàn. Xiàwǔ wǒmen " +
      "shàngkè. Sì diǎn wǒ huí jiā. Wǎnshàng wǒ zuò zuòyè, ránhòu kàn diànshì. Shí " +
      "diǎn wǒ shuìjiào.",
    translation:
      "I get up at seven every day. First I brush my teeth, then I eat breakfast. I " +
      "like drinking milk, and I like eating eggs too. At eight, I go to school. I take " +
      "the bus, and the journey takes twenty minutes. At noon I have lunch with friends. " +
      "In the afternoon we have classes. At four I go home. In the evening I do my " +
      "homework, then watch TV. At ten I go to sleep.",
  },
  {
    id: "zh-read-at-the-restaurant",
    language: "chinese",
    title: "在饭馆 (At the Restaurant)",
    cefrLevel: "A2",
    estimatedReadingMinutes: 3,
    content:
      "昨天晚上，我和家人去饭馆吃饭。那家饭馆离我们家不远，走路只要十分钟。" +
      "服务员给我们一张桌子，还给我们菜单。我点了一个鱼和一个青菜，我妈妈点了牛肉面。" +
      "我爸爸说他不饿，只要一杯茶。菜很快就来了。鱼很新鲜，青菜也很好吃。" +
      "我们吃得很开心。最后，我爸爸付了钱。我们回家的时候，已经九点了。",
    pinyin:
      "Zuótiān wǎnshàng, wǒ hé jiārén qù fànguǎn chīfàn. Nà jiā fànguǎn lí wǒmen jiā bù " +
      "yuǎn, zǒulù zhǐ yào shí fēnzhōng. Fúwùyuán gěi wǒmen yì zhāng zhuōzi, hái gěi " +
      "wǒmen càidān. Wǒ diǎn le yí gè yú hé yí gè qīngcài, wǒ māma diǎn le niúròu miàn. " +
      "Wǒ bàba shuō tā bú è, zhǐ yào yì bēi chá. Cài hěn kuài jiù lái le. Yú hěn xīnxiān, " +
      "qīngcài yě hěn hǎochī. Wǒmen chī de hěn kāixīn. Zuìhòu, wǒ bàba fù le qián. " +
      "Wǒmen huí jiā de shíhòu, yǐjīng jiǔ diǎn le.",
    translation:
      "Last night, my family and I went to a restaurant for dinner. The restaurant isn't " +
      "far from our home — only a ten-minute walk. The waiter gave us a table and a menu. " +
      "I ordered a fish and a green vegetable dish; my mother ordered beef noodles. My " +
      "father said he wasn't hungry and only wanted a cup of tea. The food came quickly. " +
      "The fish was very fresh, and the vegetables were delicious too. We ate happily. In " +
      "the end, my father paid. By the time we got home, it was already nine o'clock.",
  },
  {
    id: "zh-read-learning-chinese",
    language: "chinese",
    title: "学中文难吗？(Is Chinese Hard to Learn?)",
    cefrLevel: "B1",
    estimatedReadingMinutes: 4,
    content:
      "很多外国人觉得中文很难学。其实，中文的语法并不复杂：动词不用变化，也没有单复数。" +
      "真正的困难是汉字和声调。汉字需要一个一个地记，没有捷径；不过，如果你了解偏旁部首，" +
      "记起来就会容易得多。声调更需要练习——同样的音，声调不同，意思就完全不一样。" +
      "我建议初学者每天听二十分钟中文，并且大声跟着读。坚持半年以后，你会发现自己进步很大。",
    pinyin:
      "Hěn duō wàiguó rén juéde Zhōngwén hěn nán xué. Qíshí, Zhōngwén de yǔfǎ bìng bù " +
      "fùzá: dòngcí bú yòng biànhuà, yě méiyǒu dān-fùshù. Zhēnzhèng de kùnnán shì hànzì " +
      "hé shēngdiào. Hànzì xūyào yí gè yí gè de jì, méiyǒu jiéjìng; búguò, rúguǒ nǐ " +
      "liǎojiě piānpáng bùshǒu, jì qǐlái jiù huì róngyì de duō. Shēngdiào gèng xūyào " +
      "liànxí — tóngyàng de yīn, shēngdiào bùtóng, yìsi jiù wánquán bù yíyàng. Wǒ jiànyì " +
      "chūxuézhě měitiān tīng èrshí fēnzhōng Zhōngwén, bìngqiě dàshēng gēnzhe dú. " +
      "Jiānchí bàn nián yǐhòu, nǐ huì fāxiàn zìjǐ jìnbù hěn dà.",
    translation:
      "Many foreigners think Chinese is very hard to learn. In fact, Chinese grammar is " +
      "not complicated: verbs don't change form, and there is no singular or plural. The " +
      "real difficulties are the characters and the tones. Characters have to be memorised " +
      "one by one — there is no shortcut; however, if you understand radicals, they become " +
      "much easier to remember. Tones need even more practice: the same sound with a " +
      "different tone means something completely different. I suggest beginners listen to " +
      "twenty minutes of Chinese every day and read along out loud. After keeping it up " +
      "for six months, you'll find you have improved a great deal.",
  },
  {
    id: "zh-read-phones-and-life",
    language: "chinese",
    title: "手机改变了生活 (Phones Changed Life)",
    cefrLevel: "B2",
    estimatedReadingMinutes: 5,
    content:
      "智能手机在短短二十年里彻底改变了我们的生活方式。以前，人们出门要带地图、相机和钱包，" +
      "现在只需要一部手机就够了。它让沟通变得前所未有的方便，也让我们随时都能获得信息。" +
      "然而，方便的背后也有代价。很多人一有空就低头看屏幕，和身边的人反而越来越少交流。" +
      "有研究指出，长时间使用手机会影响睡眠质量和注意力。" +
      "因此，关键并不在于要不要用手机，而在于我们能不能控制自己的使用习惯。",
    pinyin:
      "Zhìnéng shǒujī zài duǎnduǎn èrshí nián lǐ chèdǐ gǎibiàn le wǒmen de shēnghuó " +
      "fāngshì. Yǐqián, rénmen chūmén yào dài dìtú, xiàngjī hé qiánbāo, xiànzài zhǐ " +
      "xūyào yí bù shǒujī jiù gòu le. Tā ràng gōutōng biàn de qiánsuǒwèiyǒu de " +
      "fāngbiàn, yě ràng wǒmen suíshí dōu néng huòdé xìnxī. Rán'ér, fāngbiàn de " +
      "bèihòu yě yǒu dàijià. Hěn duō rén yì yǒu kòng jiù dītóu kàn píngmù, hé " +
      "shēnbiān de rén fǎn'ér yuèláiyuè shǎo jiāoliú. Yǒu yánjiū zhǐchū, chángshíjiān " +
      "shǐyòng shǒujī huì yǐngxiǎng shuìmián zhìliàng hé zhùyìlì. Yīncǐ, guānjiàn " +
      "bìng bú zàiyú yào bú yào yòng shǒujī, ér zàiyú wǒmen néng bù néng kòngzhì " +
      "zìjǐ de shǐyòng xíguàn.",
    translation:
      "In just twenty years, smartphones have completely changed the way we live. In " +
      "the past, people had to take a map, a camera and a wallet when they went out; " +
      "now a single phone is enough. They have made communication more convenient than " +
      "ever, and let us obtain information at any time. However, there is a price " +
      "behind that convenience. Many people look down at a screen the moment they have " +
      "a free minute, and actually communicate less and less with the people around " +
      "them. Research indicates that prolonged phone use affects sleep quality and " +
      "attention. The key, therefore, is not whether to use a phone, but whether we can " +
      "control our own habits of use.",
  },
  // Stage 35: HSK 5-6 passages. These deliberately carry a translation but NO
  // pinyin: an HSK 5-6 learner reads characters directly, and full-passage
  // romanisation at this level sustains exactly the crutch they need to drop.
  // The reader hides the pinyin toggle automatically when the field is absent.
  {
    id: "zh-read-ai-and-work",
    language: "chinese",
    title: "人工智能与工作 (AI and Work)",
    cefrLevel: "C1",
    estimatedReadingMinutes: 6,
    content:
      "关于人工智能是否会大规模取代人类工作，社会上一直存在两种截然不同的看法。" +
      "悲观的一方认为，机器不知疲倦、成本低廉，一旦技术成熟，大量重复性岗位必然消失；" +
      "乐观的一方则指出，历史上每一次技术革命虽然淘汰了旧职业，但同时创造了更多新职业。" +
      "然而，这两种看法都可能过于简单。真正值得关注的，或许不是工作岗位的总数，而是结构的变化。" +
      "由于人工智能最擅长处理有明确规则的任务，受冲击最大的往往不是体力劳动者，" +
      "而是从事中等技能文书工作的人群。与此同时，需要判断力、协调能力和人际沟通的岗位反而更加稀缺。" +
      "因此，与其争论机器会不会抢走工作，不如思考教育体系应当如何调整，" +
      "使人们具备机器难以替代的能力。",
    translation:
      "Society has long held two sharply different views on whether artificial intelligence will " +
      "replace human work on a large scale. Pessimists argue that machines never tire and are " +
      "cheap, so once the technology matures large numbers of repetitive jobs must disappear. " +
      "Optimists counter that every technological revolution in history, while eliminating old " +
      "occupations, simultaneously created more new ones. However, both views may be too simple. " +
      "What deserves attention is perhaps not the total number of jobs, but the change in their " +
      "structure. Because AI is best at tasks with clear rules, those hit hardest are often not " +
      "manual labourers but people doing mid-skill clerical work. At the same time, roles " +
      "requiring judgement, coordination and interpersonal communication become scarcer still. " +
      "Rather than arguing over whether machines will take our jobs, then, it is more useful to " +
      "consider how the education system should adapt so that people acquire the capabilities " +
      "machines cannot easily replace.",
  },
  {
    id: "zh-read-language-and-thought",
    language: "chinese",
    title: "语言与思维 (Language and Thought)",
    cefrLevel: "C2",
    estimatedReadingMinutes: 7,
    content:
      "语言究竟在多大程度上塑造思维，是语言学中一个长期争论不休的问题。" +
      "上世纪中叶，有学者提出，母语的结构决定了使用者认识世界的方式；" +
      "这一观点影响深远，却也因缺乏严格的证据而屡遭批评。" +
      "近几十年来，实验研究让讨论重新变得具体。" +
      "例如，某些语言不使用左右，而只用东南西北描述方位，" +
      "其使用者在陌生环境中辨别方向的能力确实明显更强；" +
      "又如，颜色词的划分不同，会影响人们区分相近色块的反应速度。" +
      "不过，这类差异大多体现在反应快慢上，而非能否理解本身。" +
      "归根结底，语言似乎并不限制我们能想什么，" +
      "而是通过长期使用，让我们习惯于优先注意某些方面。" +
      "这一结论看似温和，实则意味深长：" +
      "它提醒我们，所谓客观的观察，往往早已被表达它的工具悄悄塑造。",
    translation:
      "Just how far language shapes thought is a question linguistics has debated endlessly. In " +
      "the mid-twentieth century, some scholars proposed that the structure of one's native " +
      "language determines how its speakers perceive the world; the view was enormously " +
      "influential, yet was repeatedly criticised for lacking rigorous evidence. In recent " +
      "decades, experimental research has made the discussion concrete again. Some languages, " +
      "for instance, do not use left and right but describe position only by compass direction, " +
      "and their speakers are indeed markedly better at orienting themselves in unfamiliar " +
      "surroundings; likewise, differences in how colour terms divide the spectrum affect how " +
      "quickly people distinguish similar shades. Most such differences, however, show up in " +
      "speed of response rather than in whether something can be understood at all. Ultimately, " +
      "language appears not to limit what we can think, but through long use to accustom us to " +
      "attending to certain aspects first. Mild as it sounds, this conclusion carries real " +
      "weight: it reminds us that so-called objective observation has often already been quietly " +
      "shaped by the instrument used to express it.",
  }
];
