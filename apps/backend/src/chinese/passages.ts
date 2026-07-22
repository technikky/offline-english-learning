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
];
