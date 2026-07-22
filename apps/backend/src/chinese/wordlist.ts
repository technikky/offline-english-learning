import type { WordlistEntry } from "../vocabulary/wordlist";

// Stage 34: a curated HSK-graded core wordlist -- the Chinese counterpart to
// vocabulary/wordlist.ts, closing the last big asymmetry between the two
// languages. Before this, Chinese learners got neither SRS deck seeding nor
// CEFR-graded recommendations, both of which English gained in Stage 33.
//
// Levels are CEFR internally, as everywhere in the platform (the UI relabels
// them HSK 1-6 for Chinese learners): A1=HSK1, A2=HSK2, B1=HSK3, B2=HSK4,
// C1=HSK5, C2=HSK6.
//
// Pinyin is carried inline at the front of each definition, and every example
// is written as 中文。(Pīnyīn.) — English. This is the same convention used by
// the Chinese grammar curriculum, and it means the entries survive being
// stored in the `vocabulary` table unchanged -- no pinyin column needed.
//
// Words are 词 (words), not single characters, except where the single
// character genuinely is the everyday word.

export const CHINESE_WORDLIST: WordlistEntry[] = [
  // ---------- A1 / HSK 1 ----------
  { word: "你好", language: "chinese", cefrLevel: "A1", definition: "nǐ hǎo — hello; the standard greeting.", example: "你好，很高兴认识你。(Nǐ hǎo, hěn gāoxìng rènshi nǐ.) — Hello, nice to meet you.", synonyms: ["您好"], antonyms: [] },
  { word: "谢谢", language: "chinese", cefrLevel: "A1", definition: "xièxie — thank you.", example: "谢谢你的帮助。(Xièxie nǐ de bāngzhù.) — Thank you for your help.", synonyms: ["多谢"], antonyms: [] },
  { word: "再见", language: "chinese", cefrLevel: "A1", definition: "zàijiàn — goodbye.", example: "明天见，再见！(Míngtiān jiàn, zàijiàn!) — See you tomorrow, goodbye!", synonyms: [], antonyms: ["你好"] },
  { word: "老师", language: "chinese", cefrLevel: "A1", definition: "lǎoshī — teacher.", example: "我们的老师很好。(Wǒmen de lǎoshī hěn hǎo.) — Our teacher is very good.", synonyms: [], antonyms: ["学生"] },
  { word: "学生", language: "chinese", cefrLevel: "A1", definition: "xuéshēng — student.", example: "他是大学学生。(Tā shì dàxué xuéshēng.) — He is a university student.", synonyms: [], antonyms: ["老师"] },
  { word: "朋友", language: "chinese", cefrLevel: "A1", definition: "péngyǒu — friend.", example: "他是我的好朋友。(Tā shì wǒ de hǎo péngyǒu.) — He is my good friend.", synonyms: [], antonyms: [] },
  { word: "家", language: "chinese", cefrLevel: "A1", definition: "jiā — home; family.", example: "我家有四口人。(Wǒ jiā yǒu sì kǒu rén.) — There are four people in my family.", synonyms: [], antonyms: [] },
  { word: "学校", language: "chinese", cefrLevel: "A1", definition: "xuéxiào — school.", example: "我每天去学校。(Wǒ měitiān qù xuéxiào.) — I go to school every day.", synonyms: [], antonyms: [] },
  { word: "吃", language: "chinese", cefrLevel: "A1", definition: "chī — to eat.", example: "我们一起吃饭吧。(Wǒmen yìqǐ chīfàn ba.) — Let's eat together.", synonyms: [], antonyms: [] },
  { word: "喝", language: "chinese", cefrLevel: "A1", definition: "hē — to drink.", example: "我想喝一杯茶。(Wǒ xiǎng hē yì bēi chá.) — I want to drink a cup of tea.", synonyms: [], antonyms: [] },
  { word: "看", language: "chinese", cefrLevel: "A1", definition: "kàn — to look at; to watch; to read.", example: "他在看书。(Tā zài kàn shū.) — He is reading a book.", synonyms: [], antonyms: [] },
  { word: "说", language: "chinese", cefrLevel: "A1", definition: "shuō — to say; to speak.", example: "请说慢一点。(Qǐng shuō màn yìdiǎn.) — Please speak a little more slowly.", synonyms: ["讲"], antonyms: [] },
  { word: "想", language: "chinese", cefrLevel: "A1", definition: "xiǎng — to want; to think; to miss.", example: "我想回家。(Wǒ xiǎng huí jiā.) — I want to go home.", synonyms: ["要"], antonyms: [] },
  { word: "水", language: "chinese", cefrLevel: "A1", definition: "shuǐ — water.", example: "请给我一杯水。(Qǐng gěi wǒ yì bēi shuǐ.) — Please give me a glass of water.", synonyms: [], antonyms: [] },
  { word: "书", language: "chinese", cefrLevel: "A1", definition: "shū — book.", example: "这本书很有意思。(Zhè běn shū hěn yǒu yìsi.) — This book is very interesting.", synonyms: [], antonyms: [] },
  { word: "今天", language: "chinese", cefrLevel: "A1", definition: "jīntiān — today.", example: "今天天气很好。(Jīntiān tiānqì hěn hǎo.) — The weather is good today.", synonyms: [], antonyms: ["昨天"] },
  { word: "明天", language: "chinese", cefrLevel: "A1", definition: "míngtiān — tomorrow.", example: "明天我们去公园。(Míngtiān wǒmen qù gōngyuán.) — Tomorrow we are going to the park.", synonyms: [], antonyms: ["昨天"] },
  { word: "多少", language: "chinese", cefrLevel: "A1", definition: "duōshao — how much; how many.", example: "这个多少钱？(Zhège duōshao qián?) — How much is this?", synonyms: ["几"], antonyms: [] },
  { word: "钱", language: "chinese", cefrLevel: "A1", definition: "qián — money.", example: "我没有带钱。(Wǒ méiyǒu dài qián.) — I didn't bring any money.", synonyms: [], antonyms: [] },
  { word: "买", language: "chinese", cefrLevel: "A1", definition: "mǎi — to buy.", example: "我要买一件衣服。(Wǒ yào mǎi yí jiàn yīfu.) — I want to buy a piece of clothing.", synonyms: [], antonyms: ["卖"] },
  { word: "很", language: "chinese", cefrLevel: "A1", definition: "hěn — very; used before most adjectives.", example: "这个菜很好吃。(Zhège cài hěn hǎochī.) — This dish is very tasty.", synonyms: ["非常"], antonyms: [] },
  { word: "好", language: "chinese", cefrLevel: "A1", definition: "hǎo — good; well; fine.", example: "身体好最重要。(Shēntǐ hǎo zuì zhòngyào.) — Good health matters most.", synonyms: [], antonyms: ["坏"] },
  { word: "大", language: "chinese", cefrLevel: "A1", definition: "dà — big; large.", example: "他住在一个大城市。(Tā zhù zài yí gè dà chéngshì.) — He lives in a big city.", synonyms: [], antonyms: ["小"] },
  { word: "小", language: "chinese", cefrLevel: "A1", definition: "xiǎo — small; little.", example: "这是一只小猫。(Zhè shì yì zhī xiǎo māo.) — This is a small cat.", synonyms: [], antonyms: ["大"] },
  { word: "工作", language: "chinese", cefrLevel: "A1", definition: "gōngzuò — work; job; to work.", example: "我妈妈在医院工作。(Wǒ māma zài yīyuàn gōngzuò.) — My mother works at a hospital.", synonyms: [], antonyms: [] },

  // ---------- A2 / HSK 2 ----------
  { word: "时间", language: "chinese", cefrLevel: "A2", definition: "shíjiān — time.", example: "你有时间吗？(Nǐ yǒu shíjiān ma?) — Do you have time?", synonyms: [], antonyms: [] },
  { word: "因为", language: "chinese", cefrLevel: "A2", definition: "yīnwèi — because.", example: "因为下雨，我们没去。(Yīnwèi xiàyǔ, wǒmen méi qù.) — Because it rained, we didn't go.", synonyms: [], antonyms: ["所以"] },
  { word: "所以", language: "chinese", cefrLevel: "A2", definition: "suǒyǐ — therefore; so.", example: "他病了，所以没来。(Tā bìng le, suǒyǐ méi lái.) — He was ill, so he didn't come.", synonyms: ["因此"], antonyms: [] },
  { word: "但是", language: "chinese", cefrLevel: "A2", definition: "dànshì — but; however.", example: "这件衣服很好，但是太贵。(Zhè jiàn yīfu hěn hǎo, dànshì tài guì.) — This is nice, but too expensive.", synonyms: ["可是"], antonyms: [] },
  { word: "觉得", language: "chinese", cefrLevel: "A2", definition: "juéde — to feel; to think (an opinion).", example: "我觉得这个主意不错。(Wǒ juéde zhège zhǔyi búcuò.) — I think this idea is good.", synonyms: ["认为"], antonyms: [] },
  { word: "希望", language: "chinese", cefrLevel: "A2", definition: "xīwàng — to hope; hope.", example: "我希望明年去中国。(Wǒ xīwàng míngnián qù Zhōngguó.) — I hope to go to China next year.", synonyms: [], antonyms: [] },
  { word: "帮助", language: "chinese", cefrLevel: "A2", definition: "bāngzhù — to help; help.", example: "谢谢你的帮助。(Xièxie nǐ de bāngzhù.) — Thank you for your help.", synonyms: ["帮忙"], antonyms: [] },
  { word: "开始", language: "chinese", cefrLevel: "A2", definition: "kāishǐ — to begin; the beginning.", example: "电影八点开始。(Diànyǐng bā diǎn kāishǐ.) — The film starts at eight.", synonyms: [], antonyms: ["结束"] },
  { word: "结束", language: "chinese", cefrLevel: "A2", definition: "jiéshù — to end; to finish.", example: "会议已经结束了。(Huìyì yǐjīng jiéshù le.) — The meeting has already ended.", synonyms: ["完"], antonyms: ["开始"] },
  { word: "问题", language: "chinese", cefrLevel: "A2", definition: "wèntí — question; problem.", example: "我有一个问题。(Wǒ yǒu yí gè wèntí.) — I have a question.", synonyms: [], antonyms: [] },
  { word: "事情", language: "chinese", cefrLevel: "A2", definition: "shìqing — thing; matter; affair.", example: "今天有很多事情要做。(Jīntiān yǒu hěn duō shìqing yào zuò.) — There are many things to do today.", synonyms: ["事"], antonyms: [] },
  { word: "休息", language: "chinese", cefrLevel: "A2", definition: "xiūxi — to rest.", example: "你累了就休息一下。(Nǐ lèi le jiù xiūxi yíxià.) — If you're tired, rest a bit.", synonyms: [], antonyms: [] },
  { word: "忙", language: "chinese", cefrLevel: "A2", definition: "máng — busy.", example: "他最近工作很忙。(Tā zuìjìn gōngzuò hěn máng.) — He has been very busy with work.", synonyms: [], antonyms: ["闲"] },
  { word: "累", language: "chinese", cefrLevel: "A2", definition: "lèi — tired.", example: "走了一天，我很累。(Zǒu le yì tiān, wǒ hěn lèi.) — After walking all day, I'm very tired.", synonyms: [], antonyms: [] },
  { word: "便宜", language: "chinese", cefrLevel: "A2", definition: "piányi — cheap; inexpensive.", example: "这家店的东西很便宜。(Zhè jiā diàn de dōngxi hěn piányi.) — Things in this shop are cheap.", synonyms: [], antonyms: ["贵"] },
  { word: "贵", language: "chinese", cefrLevel: "A2", definition: "guì — expensive.", example: "这个手机太贵了。(Zhège shǒujī tài guì le.) — This phone is too expensive.", synonyms: [], antonyms: ["便宜"] },
  { word: "旅游", language: "chinese", cefrLevel: "A2", definition: "lǚyóu — to travel; tourism.", example: "我们暑假去旅游。(Wǒmen shǔjià qù lǚyóu.) — We travel during the summer holiday.", synonyms: [], antonyms: [] },
  { word: "机场", language: "chinese", cefrLevel: "A2", definition: "jīchǎng — airport.", example: "我去机场接朋友。(Wǒ qù jīchǎng jiē péngyǒu.) — I'm going to the airport to meet a friend.", synonyms: [], antonyms: [] },
  { word: "医院", language: "chinese", cefrLevel: "A2", definition: "yīyuàn — hospital.", example: "他生病住了医院。(Tā shēngbìng zhù le yīyuàn.) — He fell ill and stayed in hospital.", synonyms: [], antonyms: [] },
  { word: "生病", language: "chinese", cefrLevel: "A2", definition: "shēngbìng — to fall ill.", example: "她昨天生病了。(Tā zuótiān shēngbìng le.) — She fell ill yesterday.", synonyms: [], antonyms: [] },
  { word: "电话", language: "chinese", cefrLevel: "A2", definition: "diànhuà — telephone; phone call.", example: "请给我打电话。(Qǐng gěi wǒ dǎ diànhuà.) — Please call me.", synonyms: [], antonyms: [] },
  { word: "介绍", language: "chinese", cefrLevel: "A2", definition: "jièshào — to introduce.", example: "我来介绍一下我的同事。(Wǒ lái jièshào yíxià wǒ de tóngshì.) — Let me introduce my colleague.", synonyms: [], antonyms: [] },
  { word: "准备", language: "chinese", cefrLevel: "A2", definition: "zhǔnbèi — to prepare; to plan to.", example: "我在准备考试。(Wǒ zài zhǔnbèi kǎoshì.) — I am preparing for an exam.", synonyms: [], antonyms: [] },
  { word: "已经", language: "chinese", cefrLevel: "A2", definition: "yǐjīng — already.", example: "他已经走了。(Tā yǐjīng zǒu le.) — He has already left.", synonyms: [], antonyms: ["还没"] },
  { word: "一起", language: "chinese", cefrLevel: "A2", definition: "yìqǐ — together.", example: "我们一起去吧。(Wǒmen yìqǐ qù ba.) — Let's go together.", synonyms: [], antonyms: [] },

  // ---------- B1 / HSK 3 ----------
  { word: "经验", language: "chinese", cefrLevel: "B1", definition: "jīngyàn — experience.", example: "他有很多教学经验。(Tā yǒu hěn duō jiàoxué jīngyàn.) — He has a lot of teaching experience.", synonyms: [], antonyms: [] },
  { word: "决定", language: "chinese", cefrLevel: "B1", definition: "juédìng — to decide; decision.", example: "我们决定明天出发。(Wǒmen juédìng míngtiān chūfā.) — We decided to set off tomorrow.", synonyms: [], antonyms: [] },
  { word: "影响", language: "chinese", cefrLevel: "B1", definition: "yǐngxiǎng — to affect; influence.", example: "天气会影响我们的计划。(Tiānqì huì yǐngxiǎng wǒmen de jìhuà.) — The weather will affect our plan.", synonyms: [], antonyms: [] },
  { word: "建议", language: "chinese", cefrLevel: "B1", definition: "jiànyì — to suggest; a suggestion.", example: "我建议你早点休息。(Wǒ jiànyì nǐ zǎodiǎn xiūxi.) — I suggest you rest earlier.", synonyms: [], antonyms: [] },
  { word: "关系", language: "chinese", cefrLevel: "B1", definition: "guānxi — relationship; connection.", example: "他们的关系很好。(Tāmen de guānxi hěn hǎo.) — Their relationship is good.", synonyms: [], antonyms: [] },
  { word: "环境", language: "chinese", cefrLevel: "B1", definition: "huánjìng — environment; surroundings.", example: "这里的学习环境很安静。(Zhèlǐ de xuéxí huánjìng hěn ānjìng.) — The study environment here is quiet.", synonyms: [], antonyms: [] },
  { word: "习惯", language: "chinese", cefrLevel: "B1", definition: "xíguàn — habit; to be used to.", example: "我已经习惯了这里的生活。(Wǒ yǐjīng xíguàn le zhèlǐ de shēnghuó.) — I'm used to life here now.", synonyms: [], antonyms: [] },
  { word: "努力", language: "chinese", cefrLevel: "B1", definition: "nǔlì — to work hard; hardworking.", example: "只要努力就会进步。(Zhǐyào nǔlì jiù huì jìnbù.) — As long as you work hard, you'll improve.", synonyms: [], antonyms: ["懒"] },
  { word: "提高", language: "chinese", cefrLevel: "B1", definition: "tígāo — to raise; to improve.", example: "我想提高我的口语。(Wǒ xiǎng tígāo wǒ de kǒuyǔ.) — I want to improve my speaking.", synonyms: ["改善"], antonyms: ["降低"] },
  { word: "参加", language: "chinese", cefrLevel: "B1", definition: "cānjiā — to take part in; to attend.", example: "他参加了这次比赛。(Tā cānjiā le zhè cì bǐsài.) — He took part in this competition.", synonyms: [], antonyms: [] },
  { word: "认为", language: "chinese", cefrLevel: "B1", definition: "rènwéi — to consider; to hold the view that.", example: "我认为这个办法可行。(Wǒ rènwéi zhège bànfǎ kěxíng.) — I consider this method workable.", synonyms: ["觉得"], antonyms: [] },
  { word: "应该", language: "chinese", cefrLevel: "B1", definition: "yīnggāi — should; ought to.", example: "你应该早点告诉我。(Nǐ yīnggāi zǎodiǎn gàosu wǒ.) — You should have told me earlier.", synonyms: [], antonyms: [] },
  { word: "需要", language: "chinese", cefrLevel: "B1", definition: "xūyào — to need; needs.", example: "这件事需要时间。(Zhè jiàn shì xūyào shíjiān.) — This matter needs time.", synonyms: [], antonyms: [] },
  { word: "计划", language: "chinese", cefrLevel: "B1", definition: "jìhuà — plan; to plan.", example: "我们的计划改变了。(Wǒmen de jìhuà gǎibiàn le.) — Our plan has changed.", synonyms: [], antonyms: [] },
  { word: "结果", language: "chinese", cefrLevel: "B1", definition: "jiéguǒ — result; as a result.", example: "考试结果下周公布。(Kǎoshì jiéguǒ xià zhōu gōngbù.) — The exam results are announced next week.", synonyms: [], antonyms: ["原因"] },
  { word: "机会", language: "chinese", cefrLevel: "B1", definition: "jīhuì — opportunity; chance.", example: "这是一个好机会。(Zhè shì yí gè hǎo jīhuì.) — This is a good opportunity.", synonyms: [], antonyms: [] },
  { word: "重要", language: "chinese", cefrLevel: "B1", definition: "zhòngyào — important.", example: "健康比什么都重要。(Jiànkāng bǐ shénme dōu zhòngyào.) — Health is more important than anything.", synonyms: [], antonyms: [] },
  { word: "简单", language: "chinese", cefrLevel: "B1", definition: "jiǎndān — simple; easy.", example: "这个问题并不简单。(Zhège wèntí bìng bù jiǎndān.) — This problem is not simple at all.", synonyms: ["容易"], antonyms: ["复杂"] },
  { word: "复杂", language: "chinese", cefrLevel: "B1", definition: "fùzá — complicated; complex.", example: "情况比想象的复杂。(Qíngkuàng bǐ xiǎngxiàng de fùzá.) — The situation is more complex than imagined.", synonyms: [], antonyms: ["简单"] },
  { word: "健康", language: "chinese", cefrLevel: "B1", definition: "jiànkāng — health; healthy.", example: "运动对健康有好处。(Yùndòng duì jiànkāng yǒu hǎochù.) — Exercise is good for your health.", synonyms: [], antonyms: [] },
  { word: "感觉", language: "chinese", cefrLevel: "B1", definition: "gǎnjué — to feel; feeling.", example: "我感觉有点不舒服。(Wǒ gǎnjué yǒudiǎn bù shūfu.) — I feel a bit unwell.", synonyms: ["觉得"], antonyms: [] },
  { word: "变化", language: "chinese", cefrLevel: "B1", definition: "biànhuà — change; to change.", example: "这几年变化很大。(Zhè jǐ nián biànhuà hěn dà.) — There have been big changes in recent years.", synonyms: [], antonyms: [] },
  { word: "选择", language: "chinese", cefrLevel: "B1", definition: "xuǎnzé — to choose; choice.", example: "你有两个选择。(Nǐ yǒu liǎng gè xuǎnzé.) — You have two choices.", synonyms: [], antonyms: [] },
  { word: "特别", language: "chinese", cefrLevel: "B1", definition: "tèbié — especially; special.", example: "我特别喜欢这首歌。(Wǒ tèbié xǐhuān zhè shǒu gē.) — I especially like this song.", synonyms: ["尤其"], antonyms: ["普通"] },
  { word: "同意", language: "chinese", cefrLevel: "B1", definition: "tóngyì — to agree.", example: "大家都同意这个方案。(Dàjiā dōu tóngyì zhège fāng'àn.) — Everyone agrees with this plan.", synonyms: [], antonyms: ["反对"] },

  // ---------- B2 / HSK 4 ----------
  { word: "压力", language: "chinese", cefrLevel: "B2", definition: "yālì — pressure; stress.", example: "学生的压力越来越大。(Xuéshēng de yālì yuèláiyuè dà.) — Students face growing pressure.", synonyms: [], antonyms: [] },
  { word: "责任", language: "chinese", cefrLevel: "B2", definition: "zérèn — responsibility.", example: "这是我们共同的责任。(Zhè shì wǒmen gòngtóng de zérèn.) — This is our shared responsibility.", synonyms: [], antonyms: [] },
  { word: "竞争", language: "chinese", cefrLevel: "B2", definition: "jìngzhēng — competition; to compete.", example: "市场竞争非常激烈。(Shìchǎng jìngzhēng fēicháng jīliè.) — Market competition is fierce.", synonyms: [], antonyms: ["合作"] },
  { word: "优点", language: "chinese", cefrLevel: "B2", definition: "yōudiǎn — advantage; strong point.", example: "这个方法的优点很明显。(Zhège fāngfǎ de yōudiǎn hěn míngxiǎn.) — This method's advantages are obvious.", synonyms: ["长处"], antonyms: ["缺点"] },
  { word: "缺点", language: "chinese", cefrLevel: "B2", definition: "quēdiǎn — shortcoming; disadvantage.", example: "每个方案都有缺点。(Měi gè fāng'àn dōu yǒu quēdiǎn.) — Every plan has drawbacks.", synonyms: [], antonyms: ["优点"] },
  { word: "支持", language: "chinese", cefrLevel: "B2", definition: "zhīchí — to support.", example: "感谢大家的支持。(Gǎnxiè dàjiā de zhīchí.) — Thank you all for your support.", synonyms: [], antonyms: ["反对"] },
  { word: "反对", language: "chinese", cefrLevel: "B2", definition: "fǎnduì — to oppose; to object.", example: "很多人反对这项政策。(Hěn duō rén fǎnduì zhè xiàng zhèngcè.) — Many people oppose this policy.", synonyms: [], antonyms: ["支持"] },
  { word: "解决", language: "chinese", cefrLevel: "B2", definition: "jiějué — to solve; to resolve.", example: "这个问题必须尽快解决。(Zhège wèntí bìxū jǐnkuài jiějué.) — This problem must be solved soon.", synonyms: [], antonyms: [] },
  { word: "保护", language: "chinese", cefrLevel: "B2", definition: "bǎohù — to protect.", example: "我们应该保护环境。(Wǒmen yīnggāi bǎohù huánjìng.) — We should protect the environment.", synonyms: [], antonyms: ["破坏"] },
  { word: "减少", language: "chinese", cefrLevel: "B2", definition: "jiǎnshǎo — to reduce; to decrease.", example: "这样可以减少浪费。(Zhèyàng kěyǐ jiǎnshǎo làngfèi.) — This can reduce waste.", synonyms: [], antonyms: ["增加"] },
  { word: "增加", language: "chinese", cefrLevel: "B2", definition: "zēngjiā — to increase.", example: "今年的人数增加了。(Jīnnián de rénshù zēngjiā le.) — The number of people increased this year.", synonyms: [], antonyms: ["减少"] },
  { word: "无论", language: "chinese", cefrLevel: "B2", definition: "wúlùn — no matter (what/how); regardless of.", example: "无论多难，我都会坚持。(Wúlùn duō nán, wǒ dōu huì jiānchí.) — No matter how hard, I'll persevere.", synonyms: ["不管"], antonyms: [] },
  { word: "尽管", language: "chinese", cefrLevel: "B2", definition: "jǐnguǎn — even though; despite.", example: "尽管很累，他还在工作。(Jǐnguǎn hěn lèi, tā hái zài gōngzuò.) — Even though he's tired, he's still working.", synonyms: ["虽然"], antonyms: [] },
  { word: "坚持", language: "chinese", cefrLevel: "B2", definition: "jiānchí — to persist; to keep it up.", example: "坚持每天练习很重要。(Jiānchí měitiān liànxí hěn zhòngyào.) — Persisting with daily practice matters.", synonyms: [], antonyms: ["放弃"] },
  { word: "放弃", language: "chinese", cefrLevel: "B2", definition: "fàngqì — to give up; to abandon.", example: "别轻易放弃你的梦想。(Bié qīngyì fàngqì nǐ de mèngxiǎng.) — Don't easily give up your dream.", synonyms: [], antonyms: ["坚持"] },
  { word: "效率", language: "chinese", cefrLevel: "B2", definition: "xiàolǜ — efficiency.", example: "新系统提高了工作效率。(Xīn xìtǒng tígāo le gōngzuò xiàolǜ.) — The new system improved efficiency.", synonyms: [], antonyms: [] },
  { word: "影响力", language: "chinese", cefrLevel: "B2", definition: "yǐngxiǎnglì — influence; clout.", example: "他在这个领域很有影响力。(Tā zài zhège lǐngyù hěn yǒu yǐngxiǎnglì.) — He has real influence in this field.", synonyms: [], antonyms: [] },
  { word: "实际", language: "chinese", cefrLevel: "B2", definition: "shíjì — actual; realistic; in practice.", example: "实际情况比这复杂。(Shíjì qíngkuàng bǐ zhè fùzá.) — The actual situation is more complex.", synonyms: [], antonyms: [] },
  { word: "普遍", language: "chinese", cefrLevel: "B2", definition: "pǔbiàn — widespread; common.", example: "这种现象很普遍。(Zhè zhǒng xiànxiàng hěn pǔbiàn.) — This phenomenon is widespread.", synonyms: [], antonyms: [] },
  { word: "确实", language: "chinese", cefrLevel: "B2", definition: "quèshí — indeed; really.", example: "他确实说过这句话。(Tā quèshí shuō guò zhè jù huà.) — He did indeed say this.", synonyms: [], antonyms: [] },

  // ---------- C1 / HSK 5 ----------
  { word: "趋势", language: "chinese", cefrLevel: "C1", definition: "qūshì — trend; tendency.", example: "这是一个明显的趋势。(Zhè shì yí gè míngxiǎn de qūshì.) — This is a clear trend.", synonyms: [], antonyms: [] },
  { word: "观念", language: "chinese", cefrLevel: "C1", definition: "guānniàn — concept; way of thinking.", example: "年轻人的观念变了。(Niánqīng rén de guānniàn biàn le.) — Young people's outlook has changed.", synonyms: [], antonyms: [] },
  { word: "措施", language: "chinese", cefrLevel: "C1", definition: "cuòshī — measure; step (taken to deal with something).", example: "政府采取了新措施。(Zhèngfǔ cǎiqǔ le xīn cuòshī.) — The government adopted new measures.", synonyms: [], antonyms: [] },
  { word: "缺乏", language: "chinese", cefrLevel: "C1", definition: "quēfá — to lack; to be short of.", example: "这份报告缺乏证据。(Zhè fèn bàogào quēfá zhèngjù.) — This report lacks evidence.", synonyms: [], antonyms: [] },
  { word: "促进", language: "chinese", cefrLevel: "C1", definition: "cùjìn — to promote; to advance.", example: "交流可以促进理解。(Jiāoliú kěyǐ cùjìn lǐjiě.) — Exchange can promote understanding.", synonyms: [], antonyms: [] },
  { word: "忽视", language: "chinese", cefrLevel: "C1", definition: "hūshì — to overlook; to ignore.", example: "这个细节不能忽视。(Zhège xìjié bù néng hūshì.) — This detail cannot be overlooked.", synonyms: [], antonyms: ["重视"] },
  { word: "显著", language: "chinese", cefrLevel: "C1", definition: "xiǎnzhù — marked; significant; notable.", example: "效果有显著的提高。(Xiàoguǒ yǒu xiǎnzhù de tígāo.) — There was a marked improvement in results.", synonyms: [], antonyms: [] },
  { word: "承认", language: "chinese", cefrLevel: "C1", definition: "chéngrèn — to admit; to acknowledge.", example: "他承认自己错了。(Tā chéngrèn zìjǐ cuò le.) — He admitted he was wrong.", synonyms: [], antonyms: ["否认"] },
  { word: "本质", language: "chinese", cefrLevel: "C1", definition: "běnzhì — essence; intrinsic nature.", example: "我们要看问题的本质。(Wǒmen yào kàn wèntí de běnzhì.) — We must look at the essence of the problem.", synonyms: [], antonyms: ["表面"] },
  { word: "依赖", language: "chinese", cefrLevel: "C1", definition: "yīlài — to depend on; to rely on.", example: "过度依赖手机不好。(Guòdù yīlài shǒujī bù hǎo.) — Over-relying on phones is not good.", synonyms: [], antonyms: ["独立"] },
  { word: "衡量", language: "chinese", cefrLevel: "C1", definition: "héngliáng — to weigh up; to measure (judge).", example: "很难用分数衡量能力。(Hěn nán yòng fēnshù héngliáng nénglì.) — It's hard to measure ability by scores.", synonyms: [], antonyms: [] },
  { word: "推动", language: "chinese", cefrLevel: "C1", definition: "tuīdòng — to push forward; to drive (progress).", example: "技术推动了社会发展。(Jìshù tuīdòng le shèhuì fāzhǎn.) — Technology has driven social development.", synonyms: ["促进"], antonyms: [] },
  { word: "面临", language: "chinese", cefrLevel: "C1", definition: "miànlín — to face; to be confronted with.", example: "我们面临很大的挑战。(Wǒmen miànlín hěn dà de tiǎozhàn.) — We face a big challenge.", synonyms: [], antonyms: [] },
  { word: "有效", language: "chinese", cefrLevel: "C1", definition: "yǒuxiào — effective; valid.", example: "这是最有效的办法。(Zhè shì zuì yǒuxiào de bànfǎ.) — This is the most effective method.", synonyms: [], antonyms: ["无效"] },
  { word: "相对", language: "chinese", cefrLevel: "C1", definition: "xiāngduì — relatively; relative.", example: "这里的房价相对便宜。(Zhèlǐ de fángjià xiāngduì piányi.) — Housing here is relatively cheap.", synonyms: [], antonyms: ["绝对"] },

  // ---------- C2 / HSK 6 ----------
  { word: "潜力", language: "chinese", cefrLevel: "C2", definition: "qiánlì — potential; latent capacity.", example: "这个项目很有潜力。(Zhège xiàngmù hěn yǒu qiánlì.) — This project has real potential.", synonyms: [], antonyms: [] },
  { word: "剖析", language: "chinese", cefrLevel: "C2", definition: "pōuxī — to dissect; to analyse in depth.", example: "文章剖析了失败的原因。(Wénzhāng pōuxī le shībài de yuányīn.) — The article dissects the causes of failure.", synonyms: ["分析"], antonyms: [] },
  { word: "弥补", language: "chinese", cefrLevel: "C2", definition: "míbǔ — to make up for; to remedy.", example: "再多的钱也弥补不了。(Zài duō de qián yě míbǔ bù liǎo.) — No amount of money can make up for it.", synonyms: [], antonyms: [] },
  { word: "潜移默化", language: "chinese", cefrLevel: "C2", definition: "qiányí-mòhuà — to influence imperceptibly over time (idiom).", example: "环境对人有潜移默化的影响。(Huánjìng duì rén yǒu qiányí-mòhuà de yǐngxiǎng.) — Environment shapes people imperceptibly.", synonyms: [], antonyms: [] },
  { word: "不言而喻", language: "chinese", cefrLevel: "C2", definition: "bùyán'éryù — it goes without saying (idiom).", example: "它的重要性不言而喻。(Tā de zhòngyàoxìng bùyán'éryù.) — Its importance goes without saying.", synonyms: [], antonyms: [] },
  { word: "归根结底", language: "chinese", cefrLevel: "C2", definition: "guīgēn-jiédǐ — in the final analysis; ultimately (idiom).", example: "归根结底还是钱的问题。(Guīgēn-jiédǐ háishì qián de wèntí.) — Ultimately it comes down to money.", synonyms: ["总之"], antonyms: [] },
  { word: "举足轻重", language: "chinese", cefrLevel: "C2", definition: "jǔzú-qīngzhòng — of pivotal importance (idiom).", example: "他在公司举足轻重。(Tā zài gōngsī jǔzú-qīngzhòng.) — He is of pivotal importance in the company.", synonyms: [], antonyms: [] },
  { word: "制约", language: "chinese", cefrLevel: "C2", definition: "zhìyuē — to constrain; to restrict.", example: "资金不足制约了发展。(Zījīn bùzú zhìyuē le fāzhǎn.) — Insufficient funding constrained development.", synonyms: ["限制"], antonyms: [] },
  { word: "凸显", language: "chinese", cefrLevel: "C2", definition: "tūxiǎn — to highlight; to make prominent.", example: "这次事件凸显了漏洞。(Zhè cì shìjiàn tūxiǎn le lòudòng.) — This incident highlighted the loopholes.", synonyms: [], antonyms: [] },
  { word: "权衡", language: "chinese", cefrLevel: "C2", definition: "quánhéng — to weigh up (pros and cons).", example: "需要权衡利弊再决定。(Xūyào quánhéng lìbì zài juédìng.) — You must weigh the pros and cons before deciding.", synonyms: [], antonyms: [] },
];
