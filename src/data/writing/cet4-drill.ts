import type { WritingTask } from '../../core/writing'

/**
 * 四级写作 · 专项训练（10 题）。
 * 每题练一个具体场景或功能段落：留言、通知、感谢信、建议书、短议论文……
 * 范文为原创，围绕题干提纲写，长度与建议字数一致。
 */
export const CET4_DRILL: WritingTask[] = [
  {
    id: 'c4w-d01',
    level: 'cet4',
    mode: 'drill',
    genre: 'letter',
    title: 'A Note to Your Roommate',
    prompt: '你今晚要去机场接朋友，可能赶不上宿舍关门时间。给室友写一张留言条，说明情况并请他帮忙留门。',
    outline: ['说明你要去哪儿、为什么晚归', '请他帮忙留门或跟宿管说明', '说明你大概几点回来'],
    wordRange: [60, 90],
    minutes: 15,
    model: {
      essay: `Dear Tom,

I have to go to the airport tonight to pick up a friend who is visiting from Shanghai. His flight lands at ten, so I probably cannot get back before the dormitory closes at eleven.

Could you please keep the door unlocked for me, or tell the dorm supervisor that I will be late? I will try to be back by half past eleven at the latest.

Thanks a lot, and sorry for the trouble.

Yours,
Li Ming`,
      highlights: [
        { phrase: 'pick up a friend', note: '接人，比 meet a friend 更口语、更具体' },
        { phrase: 'at the latest', note: '最晚，用来给时间加一个上限，很实用' },
        { phrase: 'Sorry for the trouble.', note: '留言条结尾的礼貌套语' }
      ],
      structure: '留言条按「我为什么晚归 → 请你帮什么 → 我大概几点回」三段走，每段一两句就够。'
    }
  },
  {
    id: 'c4w-d02',
    level: 'cet4',
    mode: 'drill',
    genre: 'notice',
    title: 'Volunteers Wanted for the Library',
    prompt: '校图书馆要招募学生志愿者整理书架、引导新生，请写一则通知，说明工作内容、时间与报名方式。',
    outline: ['招募目的与工作内容', '工作时间和地点', '报名方式与截止时间'],
    wordRange: [70, 100],
    minutes: 15,
    model: {
      essay: `Volunteers Wanted

The school library needs ten student volunteers to help sort books and guide freshmen during the first month of the new term.

Work will take place on Saturday mornings, from nine to eleven, on the second floor of the library. No experience is needed; short training will be given before you start.

If you are interested, please send your name and class to the library office before Friday. We look forward to working with you.

The School Library`,
      highlights: [
        { phrase: 'No experience is needed.', note: '通知里打消顾虑的一句，常见且有用' },
        { phrase: 'If you are interested', note: '通知类作文的报名引出句' },
        { phrase: 'We look forward to working with you.', note: '正式通知的收尾' }
      ],
      structure: '通知固定三段：招什么人做什么 → 时间地点与条件 → 怎么报名。'
    }
  },
  {
    id: 'c4w-d03',
    level: 'cet4',
    mode: 'drill',
    genre: 'letter',
    title: 'A Thank-you Letter to a Teacher',
    prompt: '你刚结束一学期的英语口语课，外教给了你很多帮助。写一封感谢信，说明他帮了你什么，以及你的收获。',
    outline: ['感谢他这一学期的帮助', '举一个具体的例子', '说明你的变化与祝愿'],
    wordRange: [70, 100],
    minutes: 15,
    model: {
      essay: `Dear Mr. Smith,

I am writing to thank you for your help in the oral English class this term. I used to be afraid of speaking in front of others, and my pronunciation was far from satisfactory.

What helped me most was your patience. You never laughed at my mistakes, and you encouraged me to speak slowly and clearly. Now I can give a short presentation without reading from my notes.

Thank you again for your kindness. I hope you will have a wonderful holiday.

Yours sincerely,
Li Ming`,
      highlights: [
        { phrase: 'I am writing to thank you for…', note: '感谢信的开头句式' },
        { phrase: 'far from satisfactory', note: '「远不能让人满意」，委婉描述不足' },
        { phrase: 'What helped me most was…', note: '强调句型，用来突出关键细节' }
      ],
      structure: '感谢信 = 一句点明谢什么 + 一个具体事例 + 一句祝愿，避免空泛地说 thank you very much。'
    }
  },
  {
    id: 'c4w-d04',
    level: 'cet4',
    mode: 'drill',
    genre: 'letter',
    title: 'Inviting a Friend to a Club Activity',
    prompt: '你们社团周末要办一次校园摄影活动，给留学生朋友写一封信邀请他参加，说明活动安排和需要准备的东西。',
    outline: ['邀请他参加什么活动', '时间、地点与流程', '需要带的东西与回复方式'],
    wordRange: [70, 100],
    minutes: 15,
    model: {
      essay: `Dear Anna,

Our photography club is holding a campus photo walk this Saturday, and I would like to invite you to join us.

We will meet at the main gate at two in the afternoon and walk around the lake, the old library and the sports field. A senior student will share a few tips on composition and light, so the walk should be useful even if you are a beginner.

Please bring your camera or your phone, and let me know by Friday whether you can come.

Yours,
Li Ming`,
      highlights: [
        { phrase: 'I would like to invite you to…', note: '邀请信标准开头，比 want 客气' },
        { phrase: 'even if you are a beginner', note: '让步状语，顺便打消对方顾虑' },
        { phrase: 'let me know whether you can come', note: '邀请信结尾索要答复' }
      ],
      structure: '邀请信要说清「什么活动 / 什么时候在哪儿 / 带什么、怎么回复」，三句话把事办成。'
    }
  },
  {
    id: 'c4w-d05',
    level: 'cet4',
    mode: 'drill',
    genre: 'proposal',
    title: 'A Proposal about the School Canteen',
    prompt: '不少同学反映食堂排队太久、菜品偏咸。给校长写一封建议信，指出问题并提出两条可行的改进建议。',
    outline: ['说明写信目的与问题', '两条具体建议', '表达感谢与期待'],
    wordRange: [80, 110],
    minutes: 15,
    model: {
      essay: `Dear President,

I am a sophomore writing to share a few suggestions about the school canteen.

Many students have to wait more than twenty minutes at noon, and some dishes are too salty for people from the south. I would like to suggest two changes. First, the canteen could open two extra windows during the lunch peak. Second, the cooks could offer a low-salt option and label the dishes clearly.

I believe these small changes would make the canteen more pleasant for everyone. Thank you for your time.

Yours respectfully,
Li Ming`,
      highlights: [
        { phrase: 'I am a sophomore writing to share…', note: '建议信自我介绍 + 目的，一句话交代清楚' },
        { phrase: 'the canteen could open two extra windows', note: '用 could 提建议，比 must 委婉' },
        { phrase: 'Thank you for your time.', note: '正式信件收尾' }
      ],
      structure: '建议信：先摆问题（可带数据）→ 两条建议各一句 → 表态与感谢。'
    }
  },
  {
    id: 'c4w-d06',
    level: 'cet4',
    mode: 'drill',
    genre: 'notice',
    title: 'Lost and Found',
    prompt: '你在图书馆丢了一个黑色双肩包，里面有学生证和一本笔记。写一则寻物启事，描述物品并留下联系方式。',
    outline: ['什么时候在哪儿丢的', '包的外观与里面的东西', '联系方式与感谢'],
    wordRange: [60, 90],
    minutes: 15,
    model: {
      essay: `Lost and Found

I lost a black backpack in the library on Tuesday afternoon, probably on the third floor near the window seats.

The bag is a plain black one with a small white logo on the front. Inside there is a student card, a notebook full of class notes and a pair of glasses. The notebook matters most to me because it contains a whole term of notes.

If you find it, please call me at 138-0000-0000 or leave it at the library front desk. Thank you very much.

Li Ming`,
      highlights: [
        { phrase: 'probably on the third floor', note: 'probably 让描述既具体又不绝对' },
        { phrase: 'The notebook matters most to me', note: '说明归还动机，比 important 更有分量' },
        { phrase: 'please call me at …', note: '启事类作文的联系方式句型' }
      ],
      structure: '寻物启事：丢什么、长什么样、里面有什么、怎么联系，四步写完。'
    }
  },
  {
    id: 'c4w-d07',
    level: 'cet4',
    mode: 'drill',
    genre: 'argument',
    title: 'Should Phones Be Banned in Class?',
    prompt: '有人认为课堂上应禁止使用手机，有人认为手机可以辅助学习。写一段短文表达你的看法，并给出理由。',
    outline: ['简要交代争议', '你的观点与两条理由', '一句总结'],
    wordRange: [90, 120],
    minutes: 15,
    model: {
      essay: `Whether phones should be banned in class has been widely discussed on campus.

In my opinion, phones should be put away during lectures but allowed for group work. First, a phone on the desk easily pulls attention away: a single message can break a whole chain of thought. Second, when we work in groups, phones help us look up words and share materials quickly.

The key is not the phone itself but when we use it. A clear rule, rather than a total ban, is more practical for both teachers and students.`,
      highlights: [
        { phrase: 'has been widely discussed', note: '交代争议的常用开头' },
        { phrase: 'The key is not … but …', note: '把讨论从工具拉回使用方式，收尾有力' },
        { phrase: 'rather than a total ban', note: 'rather than 做插入语，表达取舍' }
      ],
      structure: '观点段：争议一句 → 观点一句 → 两条理由（First/Second）→ 一句收束。'
    }
  },
  {
    id: 'c4w-d08',
    level: 'cet4',
    mode: 'drill',
    genre: 'chart',
    title: 'How Students Spend Their Free Time',
    prompt: '下表是一次班级调查：课余时间用于刷手机 48%、运动 22%、阅读 18%、其他 12%。用一段话描述数据并给出你的看法。',
    outline: ['一句话概括调查内容', '分两组描述数据', '你的看法或建议'],
    wordRange: [80, 110],
    minutes: 15,
    model: {
      essay: `A recent survey in our class asked forty students how they spend their free time.

Nearly half of them, about forty-eight percent, spend most of it on their phones, while only twenty-two percent choose sports. Reading comes third at eighteen percent, and the remaining twelve percent do other things.

The figures suggest that phones take up far more time than exercise or books. I think we could set a simple rule, such as reading for twenty minutes before opening a short video app.`,
      highlights: [
        { phrase: 'Nearly half of them, about forty-eight percent', note: '先给大致比例再给精确数字，读数更自然' },
        { phrase: 'comes third at eighteen percent', note: 'come third/first 描述排名' },
        { phrase: 'The figures suggest that…', note: '图表作文的解读句，比 the chart says 更书面' }
      ],
      structure: '图表作文：总述一句 → 数据分两档 → 解读一句 → 建议一句。'
    }
  },
  {
    id: 'c4w-d09',
    level: 'cet4',
    mode: 'drill',
    genre: 'speech',
    title: 'A Short Welcome Speech',
    prompt: '你是老生代表，要在新生欢迎会上做一分钟发言。写一段发言稿，欢迎新生并给出两条建议。',
    outline: ['欢迎新生', '两条适应大学生活的建议', '一句鼓励'],
    wordRange: [80, 110],
    minutes: 15,
    model: {
      essay: `Dear freshmen, welcome to our university.

Three years ago I sat where you are sitting now, and I still remember how excited and nervous I felt. Let me share two suggestions. First, join one club you truly enjoy; it is the fastest way to make friends. Second, keep a simple weekly plan, because university life gives you a lot of freedom and very little reminder.

Do not worry about making mistakes. Every senior you meet today was once a confused freshman too. Enjoy your first term.`,
      highlights: [
        { phrase: 'I sat where you are sitting now', note: '用场景拉近距离，比 welcome again 有画面' },
        { phrase: 'gives you a lot of freedom and very little reminder', note: '对比结构解释为什么要做计划' },
        { phrase: 'was once a confused freshman too', note: '结尾共情，适合口语稿' }
      ],
      structure: '致辞：欢迎 → 自身经历一句 → 两条建议 → 鼓励收尾。'
    }
  },
  {
    id: 'c4w-d10',
    level: 'cet4',
    mode: 'drill',
    genre: 'letter',
    title: 'Asking for Leave',
    prompt: '你因发烧需要请两天假，写一张请假条给班主任，说明原因、请假时间以及课程补上的安排。',
    outline: ['请假原因与时间', '已请同学帮忙记笔记', '回来后的补课安排'],
    wordRange: [60, 90],
    minutes: 15,
    model: {
      essay: `Dear Mr. Wang,

I am sorry to tell you that I have caught a bad cold and the doctor advises me to rest at home for two days, so I would like to ask for leave on Monday and Tuesday.

I have asked my classmate Li Hua to take notes for me, and I will finish the reading task before I return. I will also go to your office to catch up on anything I miss.

Thank you for your understanding.

Yours,
Li Ming`,
      highlights: [
        { phrase: 'the doctor advises me to rest', note: '请假条里给理由加一个「第三方」依据' },
        { phrase: 'ask for leave', note: '请假固定搭配' },
        { phrase: 'catch up on anything I miss', note: '补上落下的内容，非常常用的短语' }
      ],
      structure: '请假条：原因 + 天数 → 已做的补救 → 回来后的安排 → 致谢。'
    }
  }
]
