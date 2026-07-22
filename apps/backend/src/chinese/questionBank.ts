import type { BankQuestion } from "../quiz/questionBank";

// Stage 38: curated Mandarin quiz questions, the Chinese half of the bank.
//
// Four categories, matching the Chinese quiz category list (Stage 31):
// grammar, vocabulary, everyday_chinese, and `characters` -- the last has no
// English equivalent and tests 汉字 knowledge directly: radicals, visually
// similar characters, and character-to-pinyin matching.
//
// Pinyin is given inline wherever a learner would otherwise be unable to read
// the option, following the convention used throughout the Chinese content.
// True/False options stay in English because the response parser and the
// grading comparison both match on them.

const TF = ["True", "False"];

export const CHINESE_QUESTIONS: BankQuestion[] = [
  // ===== grammar =====
  { id: "zh-gram-a1-1", language: "chinese", category: "grammar", cefrLevel: "A1", type: "multiple_choice", question: "选择正确的语序：", options: ["我喝茶。", "我茶喝。", "喝我茶。", "茶我喝。"], correctAnswer: "我喝茶。", explanation: "Chinese basic order is Subject-Verb-Object, like English." },
  { id: "zh-gram-a1-2", language: "chinese", category: "grammar", cefrLevel: "A1", type: "multiple_choice", question: "把「你是学生」变成疑问句：", options: ["你是学生吗？", "吗你是学生？", "你吗是学生？", "是你学生？"], correctAnswer: "你是学生吗？", explanation: "吗 (ma) goes at the very end; the word order does not change." },
  { id: "zh-gram-a1-3", language: "chinese", category: "grammar", cefrLevel: "A1", type: "true_false", question: "In Chinese, the verb changes form to show past tense.", options: TF, correctAnswer: "False", explanation: "Chinese verbs never conjugate; time is shown by words like 了 or time expressions." },

  { id: "zh-gram-a2-1", language: "chinese", category: "grammar", cefrLevel: "A2", type: "multiple_choice", question: "三___书 (three books)", options: ["个", "本", "只", "杯"], correctAnswer: "本", explanation: "本 (běn) is the measure word for books." },
  { id: "zh-gram-a2-2", language: "chinese", category: "grammar", cefrLevel: "A2", type: "multiple_choice", question: "「我吃了饭」中的「了」表示什么？", options: ["未来", "完成 (completed action)", "否定", "疑问"], correctAnswer: "完成 (completed action)", explanation: "了 after a verb marks completion — it is not a past tense." },
  { id: "zh-gram-a2-3", language: "chinese", category: "grammar", cefrLevel: "A2", type: "multiple_choice", question: "两___咖啡 (two cups of coffee)", options: ["本", "杯", "件", "张"], correctAnswer: "杯", explanation: "杯 (bēi) is the measure word for cups/glasses; note 二 becomes 两 here." },

  { id: "zh-gram-b1-1", language: "chinese", category: "grammar", cefrLevel: "B1", type: "multiple_choice", question: "选择正确的句子：", options: ["我比他很高。", "我比他高。", "我很比他高。", "我比高他。"], correctAnswer: "我比他高。", explanation: "Never put 很 before the adjective in a 比 comparison." },
  { id: "zh-gram-b1-2", language: "chinese", category: "grammar", cefrLevel: "B1", type: "multiple_choice", question: "补全：我把门___。", options: ["关", "关了", "了关", "关吗"], correctAnswer: "关了", explanation: "In a 把 sentence the verb must be followed by a result or 了 — a bare verb is wrong." },
  { id: "zh-gram-b1-3", language: "chinese", category: "grammar", cefrLevel: "B1", type: "true_false", question: "「我没有他高」means 'I am not as tall as him'.", options: TF, correctAnswer: "True", explanation: "没有 replaces 比 to express 'not as … as'." },

  { id: "zh-gram-b2-1", language: "chinese", category: "grammar", cefrLevel: "B2", type: "multiple_choice", question: "他说___很好。(He speaks very well.)", options: ["的", "得", "地", "了"], correctAnswer: "得", explanation: "A degree complement uses 得, not the possessive 的 or adverbial 地." },
  { id: "zh-gram-b2-2", language: "chinese", category: "grammar", cefrLevel: "B2", type: "multiple_choice", question: "选择正确的被动句：", options: ["我的自行车被偷了。", "我的自行车被偷。", "被我的自行车偷了。", "我的自行车了被偷。"], correctAnswer: "我的自行车被偷了。", explanation: "As with 把, the verb in a 被 sentence needs a result or 了 after it." },
  { id: "zh-gram-b2-3", language: "chinese", category: "grammar", cefrLevel: "B2", type: "multiple_choice", question: "他写汉字写___很漂亮。", options: ["的", "得", "地", "着"], correctAnswer: "得", explanation: "When the verb takes an object, repeat the verb before 得." },

  { id: "zh-gram-c1-1", language: "chinese", category: "grammar", cefrLevel: "C1", type: "multiple_choice", question: "「这本书我看不懂」的意思是：", options: ["我不被允许看", "我没有能力理解", "我不想看", "我还没看"], correctAnswer: "我没有能力理解", explanation: "看不懂 is a potential complement — lacking the ability — unlike 不能看, which means not permitted." },
  { id: "zh-gram-c1-2", language: "chinese", category: "grammar", cefrLevel: "C1", type: "multiple_choice", question: "选择最书面的连接词：", options: ["因为", "由于", "所以说", "还有"], correctAnswer: "由于", explanation: "由于 is the written-register equivalent of the spoken 因为." },
  { id: "zh-gram-c1-3", language: "chinese", category: "grammar", cefrLevel: "C1", type: "true_false", question: "「不仅…而且…」is a paired connective used in formal writing.", options: TF, correctAnswer: "True", explanation: "It means 'not only … but also' and is typical of 书面语." },

  { id: "zh-gram-c2-1", language: "chinese", category: "grammar", cefrLevel: "C2", type: "multiple_choice", question: "哪一句最适合正式书面语？", options: ["这个问题很难吧？", "该问题颇具难度。", "这题好难啊。", "这个题目难不难呢？"], correctAnswer: "该问题颇具难度。", explanation: "该/颇具 belong to written register; 吧/啊/呢 are spoken particles." },
  { id: "zh-gram-c2-2", language: "chinese", category: "grammar", cefrLevel: "C2", type: "multiple_choice", question: "「参与者均须提前报名」中的「均」相当于：", options: ["都", "很", "又", "才"], correctAnswer: "都", explanation: "均 is the formal written equivalent of 都." },
  { id: "zh-gram-c2-3", language: "chinese", category: "grammar", cefrLevel: "C2", type: "true_false", question: "成语 can normally be expanded with extra words inserted inside them.", options: TF, correctAnswer: "False", explanation: "成语 are fixed four-character units and cannot be altered or expanded." },

  // ===== vocabulary =====
  { id: "zh-vocab-a1-1", language: "chinese", category: "vocabulary", cefrLevel: "A1", type: "multiple_choice", question: "「谢谢」的意思是：", options: ["hello", "goodbye", "thank you", "sorry"], correctAnswer: "thank you", explanation: "谢谢 (xièxie) means thank you." },
  { id: "zh-vocab-a1-2", language: "chinese", category: "vocabulary", cefrLevel: "A1", type: "multiple_choice", question: "「大」的反义词是：", options: ["小 (xiǎo)", "好 (hǎo)", "多 (duō)", "高 (gāo)"], correctAnswer: "小 (xiǎo)", explanation: "小 (small) is the opposite of 大 (big)." },
  { id: "zh-vocab-a1-3", language: "chinese", category: "vocabulary", cefrLevel: "A1", type: "multiple_choice", question: "Which word means 'to drink'?", options: ["吃 (chī)", "喝 (hē)", "看 (kàn)", "买 (mǎi)"], correctAnswer: "喝 (hē)", explanation: "喝 means to drink; 吃 means to eat." },

  { id: "zh-vocab-a2-1", language: "chinese", category: "vocabulary", cefrLevel: "A2", type: "multiple_choice", question: "「便宜」的反义词是：", options: ["贵 (guì)", "忙 (máng)", "累 (lèi)", "快 (kuài)"], correctAnswer: "贵 (guì)", explanation: "贵 (expensive) is the opposite of 便宜 (cheap)." },
  { id: "zh-vocab-a2-2", language: "chinese", category: "vocabulary", cefrLevel: "A2", type: "multiple_choice", question: "「开始」的反义词是：", options: ["结束 (jiéshù)", "希望 (xīwàng)", "帮助 (bāngzhù)", "准备 (zhǔnbèi)"], correctAnswer: "结束 (jiéshù)", explanation: "结束 means to end, the opposite of 开始 (to begin)." },
  { id: "zh-vocab-a2-3", language: "chinese", category: "vocabulary", cefrLevel: "A2", type: "true_false", question: "「觉得」and「认为」can both express an opinion.", options: TF, correctAnswer: "True", explanation: "They are near-synonyms, though 认为 is slightly more formal." },

  { id: "zh-vocab-b1-1", language: "chinese", category: "vocabulary", cefrLevel: "B1", type: "multiple_choice", question: "「提高」的意思最接近：", options: ["降低 (lower)", "改善 / 使更好 (improve)", "开始 (begin)", "忘记 (forget)"], correctAnswer: "改善 / 使更好 (improve)", explanation: "提高 means to raise or improve." },
  { id: "zh-vocab-b1-2", language: "chinese", category: "vocabulary", cefrLevel: "B1", type: "multiple_choice", question: "「复杂」的反义词是：", options: ["简单 (jiǎndān)", "重要 (zhòngyào)", "特别 (tèbié)", "健康 (jiànkāng)"], correctAnswer: "简单 (jiǎndān)", explanation: "简单 (simple) is the opposite of 复杂 (complicated)." },
  { id: "zh-vocab-b1-3", language: "chinese", category: "vocabulary", cefrLevel: "B1", type: "multiple_choice", question: "「机会」的意思是：", options: ["opportunity", "machine", "problem", "result"], correctAnswer: "opportunity", explanation: "机会 (jīhuì) means a chance or opportunity." },

  { id: "zh-vocab-b2-1", language: "chinese", category: "vocabulary", cefrLevel: "B2", type: "multiple_choice", question: "「支持」的反义词是：", options: ["反对 (fǎnduì)", "解决 (jiějué)", "保护 (bǎohù)", "增加 (zēngjiā)"], correctAnswer: "反对 (fǎnduì)", explanation: "反对 (to oppose) is the opposite of 支持 (to support)." },
  { id: "zh-vocab-b2-2", language: "chinese", category: "vocabulary", cefrLevel: "B2", type: "multiple_choice", question: "「坚持」的意思是：", options: ["放弃 (give up)", "持续努力 (persevere)", "休息 (rest)", "忘记 (forget)"], correctAnswer: "持续努力 (persevere)", explanation: "坚持 means to persist; 放弃 is its opposite." },
  { id: "zh-vocab-b2-3", language: "chinese", category: "vocabulary", cefrLevel: "B2", type: "multiple_choice", question: "「效率」指的是：", options: ["efficiency", "influence", "responsibility", "competition"], correctAnswer: "efficiency", explanation: "效率 (xiàolǜ) means efficiency." },

  { id: "zh-vocab-c1-1", language: "chinese", category: "vocabulary", cefrLevel: "C1", type: "multiple_choice", question: "「忽视」的意思是：", options: ["重视 (attach importance to)", "忽略 / 不重视 (overlook)", "观察 (observe)", "促进 (promote)"], correctAnswer: "忽略 / 不重视 (overlook)", explanation: "忽视 means to overlook or disregard; 重视 is its opposite." },
  { id: "zh-vocab-c1-2", language: "chinese", category: "vocabulary", cefrLevel: "C1", type: "multiple_choice", question: "「缺乏」最适合搭配下面哪个词？", options: ["缺乏证据", "缺乏地跑", "缺乏很好", "缺乏了吗"], correctAnswer: "缺乏证据", explanation: "缺乏 takes an abstract noun object, e.g. 缺乏证据 (lack evidence)." },
  { id: "zh-vocab-c1-3", language: "chinese", category: "vocabulary", cefrLevel: "C1", type: "multiple_choice", question: "「显著」的意思最接近：", options: ["明显的 (marked/notable)", "微小的 (tiny)", "普通的 (ordinary)", "困难的 (difficult)"], correctAnswer: "明显的 (marked/notable)", explanation: "显著 describes a marked, easily noticed degree." },

  { id: "zh-vocab-c2-1", language: "chinese", category: "vocabulary", cefrLevel: "C2", type: "multiple_choice", question: "「归根结底」的意思是：", options: ["in the final analysis", "from the very beginning", "by coincidence", "on the contrary"], correctAnswer: "in the final analysis", explanation: "归根结底 introduces the ultimate underlying point." },
  { id: "zh-vocab-c2-2", language: "chinese", category: "vocabulary", cefrLevel: "C2", type: "multiple_choice", question: "「潜移默化」形容：", options: ["突然的改变", "不知不觉中的影响", "强迫的命令", "完全没有变化"], correctAnswer: "不知不觉中的影响", explanation: "潜移默化 describes influence exerted imperceptibly over time." },
  { id: "zh-vocab-c2-3", language: "chinese", category: "vocabulary", cefrLevel: "C2", type: "multiple_choice", question: "「制约」的意思是：", options: ["限制 (to constrain)", "鼓励 (to encourage)", "解释 (to explain)", "扩大 (to expand)"], correctAnswer: "限制 (to constrain)", explanation: "制约 means to restrict or condition something." },

  // ===== everyday_chinese =====
  { id: "zh-day-a1-1", language: "chinese", category: "everyday_chinese", cefrLevel: "A1", type: "multiple_choice", question: "别人说「谢谢」，你回答：", options: ["不客气。(Bú kèqi.)", "对不起。(Duìbuqǐ.)", "再见。(Zàijiàn.)", "你好。(Nǐ hǎo.)"], correctAnswer: "不客气。(Bú kèqi.)", explanation: "不客气 is the standard reply to thanks." },
  { id: "zh-day-a1-2", language: "chinese", category: "everyday_chinese", cefrLevel: "A1", type: "multiple_choice", question: "在商店里问价钱，你说：", options: ["多少钱？(Duōshao qián?)", "什么钱？", "几钱是？", "钱多少有？"], correctAnswer: "多少钱？(Duōshao qián?)", explanation: "多少钱 is the fixed way to ask a price." },
  { id: "zh-day-a1-3", language: "chinese", category: "everyday_chinese", cefrLevel: "A1", type: "true_false", question: "「再见」is said when meeting someone for the first time.", options: TF, correctAnswer: "False", explanation: "再见 means goodbye; use 你好 when meeting." },

  { id: "zh-day-a2-1", language: "chinese", category: "everyday_chinese", cefrLevel: "A2", type: "multiple_choice", question: "你想问路，最礼貌的说法是：", options: ["请问，去火车站怎么走？", "火车站！", "你说火车站。", "我要火车站。"], correctAnswer: "请问，去火车站怎么走？", explanation: "请问 politely opens a request for information." },
  { id: "zh-day-a2-2", language: "chinese", category: "everyday_chinese", cefrLevel: "A2", type: "multiple_choice", question: "在饭馆点菜时，服务员会问：", options: ["您要点什么？", "您在哪儿？", "您是谁？", "您几岁？"], correctAnswer: "您要点什么？", explanation: "点 means to order dishes; 您 is the polite 'you'." },
  { id: "zh-day-a2-3", language: "chinese", category: "everyday_chinese", cefrLevel: "A2", type: "multiple_choice", question: "有人踩到你的脚，他会说：", options: ["对不起。", "不客气。", "没关系。", "谢谢。"], correctAnswer: "对不起。", explanation: "对不起 is the apology; 没关系 is the reply to it." },

  { id: "zh-day-b1-1", language: "chinese", category: "everyday_chinese", cefrLevel: "B1", type: "multiple_choice", question: "朋友请你吃饭，你想婉拒，最合适的是：", options: ["不行。", "今天恐怕不方便，改天好吗？", "我不去。", "为什么问我？"], correctAnswer: "今天恐怕不方便，改天好吗？", explanation: "恐怕 softens the refusal and 改天 offers an alternative — the polite pattern." },
  { id: "zh-day-b1-2", language: "chinese", category: "everyday_chinese", cefrLevel: "B1", type: "multiple_choice", question: "「马马虎虎」的意思是：", options: ["非常好", "一般，还可以", "完全不行", "很快"], correctAnswer: "一般，还可以", explanation: "马马虎虎 means so-so or passable." },
  { id: "zh-day-b1-3", language: "chinese", category: "everyday_chinese", cefrLevel: "B1", type: "true_false", question: "「哪里哪里」can be used to modestly deflect a compliment.", options: TF, correctAnswer: "True", explanation: "It is a conventional modest response to praise." },

  { id: "zh-day-b2-1", language: "chinese", category: "everyday_chinese", cefrLevel: "B2", type: "multiple_choice", question: "在会议上委婉地表示不同意见：", options: ["你错了。", "我理解你的意思，不过我有不同的看法。", "这没有道理。", "不对。"], correctAnswer: "我理解你的意思，不过我有不同的看法。", explanation: "Acknowledging first keeps the disagreement professional." },
  { id: "zh-day-b2-2", language: "chinese", category: "everyday_chinese", cefrLevel: "B2", type: "multiple_choice", question: "「随便」在点菜时表示：", options: ["我不吃", "你决定就好", "这很贵", "我很饿"], correctAnswer: "你决定就好", explanation: "随便 here means 'anything is fine — you choose'." },
  { id: "zh-day-b2-3", language: "chinese", category: "everyday_chinese", cefrLevel: "B2", type: "multiple_choice", question: "写正式邮件时，开头最合适的是：", options: ["喂！", "尊敬的李经理：", "老李啊", "你好吗？"], correctAnswer: "尊敬的李经理：", explanation: "尊敬的 + title is the standard formal salutation." },

  { id: "zh-day-c1-1", language: "chinese", category: "everyday_chinese", cefrLevel: "C1", type: "multiple_choice", question: "「不好意思」在下面哪种情况下最常用？", options: ["表达轻微的歉意或麻烦别人时", "非常严重的道歉", "表示愤怒", "表示同意"], correctAnswer: "表达轻微的歉意或麻烦别人时", explanation: "不好意思 is a light apology or a softener before troubling someone." },
  { id: "zh-day-c1-2", language: "chinese", category: "everyday_chinese", cefrLevel: "C1", type: "multiple_choice", question: "「我尽量」作为回答，通常表示：", options: ["一定可以", "会努力，但不保证", "完全拒绝", "已经完成"], correctAnswer: "会努力，但不保证", explanation: "尽量 commits to effort without promising the outcome." },
  { id: "zh-day-c1-3", language: "chinese", category: "everyday_chinese", cefrLevel: "C1", type: "true_false", question: "「再说吧」usually signals genuine enthusiasm to continue the discussion.", options: TF, correctAnswer: "False", explanation: "It usually defers politely and often signals reluctance." },

  { id: "zh-day-c2-1", language: "chinese", category: "everyday_chinese", cefrLevel: "C2", type: "multiple_choice", question: "「这件事还有待商榷」的言外之意是：", options: ["完全同意", "委婉表示不赞成", "已经决定", "非常紧急"], correctAnswer: "委婉表示不赞成", explanation: "有待商榷 is a formal, indirect way of signalling disagreement." },
  { id: "zh-day-c2-2", language: "chinese", category: "everyday_chinese", cefrLevel: "C2", type: "multiple_choice", question: "「给面子」的意思是：", options: ["让对方保住尊严", "直接批评对方", "送一份礼物", "拒绝邀请"], correctAnswer: "让对方保住尊严", explanation: "给面子 means allowing someone to keep their dignity in public." },
  { id: "zh-day-c2-3", language: "chinese", category: "everyday_chinese", cefrLevel: "C2", type: "true_false", question: "「我考虑考虑」often functions as a soft refusal rather than a literal promise to think.", options: TF, correctAnswer: "True", explanation: "Reduplicated 考虑考虑 commonly softens a decline." },

  // ===== characters (no English equivalent) =====
  { id: "zh-char-a1-1", language: "chinese", category: "characters", cefrLevel: "A1", type: "multiple_choice", question: "「人」的意思是：", options: ["person", "big", "sky", "mountain"], correctAnswer: "person", explanation: "人 (rén) is a pictograph of a walking person." },
  { id: "zh-char-a1-2", language: "chinese", category: "characters", cefrLevel: "A1", type: "multiple_choice", question: "「好」的拼音是：", options: ["hǎo", "hào", "hāo", "háo"], correctAnswer: "hǎo", explanation: "好 is third tone: hǎo." },
  { id: "zh-char-a1-3", language: "chinese", category: "characters", cefrLevel: "A1", type: "multiple_choice", question: "哪个字有「口」这个部首？", options: ["吃", "河", "树", "花"], correctAnswer: "吃", explanation: "吃 contains the mouth radical 口, fitting its meaning 'to eat'." },

  { id: "zh-char-a2-1", language: "chinese", category: "characters", cefrLevel: "A2", type: "multiple_choice", question: "「氵」这个部首通常和什么有关？", options: ["水 (water)", "火 (fire)", "木 (wood)", "手 (hand)"], correctAnswer: "水 (water)", explanation: "氵 is the water radical, seen in 河, 海, 洗." },
  { id: "zh-char-a2-2", language: "chinese", category: "characters", cefrLevel: "A2", type: "multiple_choice", question: "下面哪两个字最容易混淆？", options: ["日 和 目", "人 和 水", "口 和 木", "山 和 火"], correctAnswer: "日 和 目", explanation: "日 (sun) and 目 (eye) differ only by one stroke inside." },
  { id: "zh-char-a2-3", language: "chinese", category: "characters", cefrLevel: "A2", type: "multiple_choice", question: "「买」和「卖」的区别是：", options: ["买 = buy，卖 = sell", "两个都是 buy", "买 = sell，卖 = buy", "两个都是 sell"], correctAnswer: "买 = buy，卖 = sell", explanation: "卖 has an extra 十 on top; the two are opposites." },

  { id: "zh-char-b1-1", language: "chinese", category: "characters", cefrLevel: "B1", type: "multiple_choice", question: "「忄」部首和什么有关？", options: ["心 / 感情 (heart, emotion)", "水 (water)", "言 (speech)", "金 (metal)"], correctAnswer: "心 / 感情 (heart, emotion)", explanation: "忄 is the heart radical, in 快, 忙, 情." },
  { id: "zh-char-b1-2", language: "chinese", category: "characters", cefrLevel: "B1", type: "multiple_choice", question: "「言」/「讠」部首常出现在哪类字中？", options: ["和说话有关的字", "和吃饭有关的字", "和走路有关的字", "和天气有关的字"], correctAnswer: "和说话有关的字", explanation: "讠 marks speech-related characters: 说, 语, 谢." },
  { id: "zh-char-b1-3", language: "chinese", category: "characters", cefrLevel: "B1", type: "true_false", question: "Most Chinese characters combine a meaning component with a sound component.", options: TF, correctAnswer: "True", explanation: "The majority are 形声字 (phono-semantic compounds)." },

  { id: "zh-char-b2-1", language: "chinese", category: "characters", cefrLevel: "B2", type: "multiple_choice", question: "「的」「得」「地」中，哪一个用在动词后表示程度？", options: ["得", "的", "地", "都可以"], correctAnswer: "得", explanation: "得 introduces a degree complement: 说得很好." },
  { id: "zh-char-b2-2", language: "chinese", category: "characters", cefrLevel: "B2", type: "multiple_choice", question: "「银」「铁」「钱」共同的部首是：", options: ["钅 (metal)", "木 (wood)", "土 (earth)", "石 (stone)"], correctAnswer: "钅 (metal)", explanation: "钅 is the metal radical, fitting all three meanings." },
  { id: "zh-char-b2-3", language: "chinese", category: "characters", cefrLevel: "B2", type: "multiple_choice", question: "「在」和「再」的区别是：", options: ["在 = at/in，再 = again", "两个完全一样", "在 = again，再 = at/in", "都表示时间"], correctAnswer: "在 = at/in，再 = again", explanation: "They sound alike (zài) but are unrelated in meaning — a common error." },

  { id: "zh-char-c1-1", language: "chinese", category: "characters", cefrLevel: "C1", type: "multiple_choice", question: "「彳」部首多与什么有关？", options: ["行走 / 道路", "水", "火", "手"], correctAnswer: "行走 / 道路", explanation: "彳 relates to walking or roads, as in 很, 往, 律." },
  { id: "zh-char-c1-2", language: "chinese", category: "characters", cefrLevel: "C1", type: "multiple_choice", question: "「幸」和「辛」的差别在于：", options: ["笔画不同，意思完全不同", "只是写法变体", "读音相同意思相同", "都表示辛苦"], correctAnswer: "笔画不同，意思完全不同", explanation: "幸 means fortunate, 辛 means bitter/toilsome — visually similar, unrelated." },
  { id: "zh-char-c1-3", language: "chinese", category: "characters", cefrLevel: "C1", type: "true_false", question: "Knowing a character's radical often lets you guess its general meaning area.", options: TF, correctAnswer: "True", explanation: "The semantic radical narrows the field, which is why radicals are worth learning." },

  { id: "zh-char-c2-1", language: "chinese", category: "characters", cefrLevel: "C2", type: "multiple_choice", question: "「不言而喻」中的「喻」意思最接近：", options: ["说明 / 明白 (make clear, understand)", "喜欢", "计算", "旅行"], correctAnswer: "说明 / 明白 (make clear, understand)", explanation: "喻 carries the sense of explaining or being understood." },
  { id: "zh-char-c2-2", language: "chinese", category: "characters", cefrLevel: "C2", type: "multiple_choice", question: "「藉」在书面语中常与哪个字通用？", options: ["借", "结", "接", "节"], correctAnswer: "借", explanation: "藉 is a literary variant used where 借 appears in modern writing." },
  { id: "zh-char-c2-3", language: "chinese", category: "characters", cefrLevel: "C2", type: "multiple_choice", question: "简体「广」对应的繁体字是：", options: ["廣", "厂", "庆", "庄"], correctAnswer: "廣", explanation: "廣 is the traditional form simplified to 广." },
];
