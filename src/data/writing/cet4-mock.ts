import type { WritingTask } from '../../core/writing'

/**
 * 四级写作 · 真题模拟（10 题）。
 * 按 2016–2026 各场次的常见命题方向重写：观点类、现象类、书信类、图表类。
 * source 只标注「对应场次的题型」，材料与范文均为原创仿真，不是真题原文。
 */
export const CET4_MOCK: WritingTask[] = [
  {
    id: 'c4w-m01',
    level: 'cet4',
    mode: 'mock',
    genre: 'argument',
    title: 'Online Learning: Good or Bad?',
    prompt: '近年来越来越多的大学生选择在线课程。有人认为它灵活高效，也有人担心缺少监督。请就此写一篇短文，说明你的看法并给出理由。',
    outline: ['交代现象', '你的观点', '两条理由或一个例子', '总结'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2016 年 6 月 · 卷 A',
    year: 2016,
    model: {
      essay: `Online courses have become a normal part of university life. Some students praise them for the freedom they offer, while others worry that learning alone in front of a screen is easy to give up on.

In my view, online learning is a useful tool rather than a replacement for the classroom. Its greatest strength is flexibility. A student who works part-time can watch a lecture at eleven at night, pause it, and replay the part that confused him. What is more, good courses can reach thousands of learners at once, which traditional classrooms simply cannot do.

The weakness is equally clear: without a fixed timetable and a teacher nearby, many of us postpone the work until the deadline. Therefore the best choice is to combine the two: take an online course for the topic you are curious about, and keep your weekly routine with classmates for everything else.

Used with discipline, online learning widens the door to knowledge.`,
      highlights: [
        { phrase: 'a useful tool rather than a replacement', note: 'rather than 给出有分寸的立场' },
        { phrase: 'What is more', note: '递进连接词，比 and 更有层次' },
        { phrase: 'Used with discipline', note: '分词短语开头，收束有力' }
      ],
      structure: '现象 → 观点 → 优点（灵活、覆盖广）→ 缺点（无人监督）→ 折中建议。'
    }
  },
  {
    id: 'c4w-m02',
    level: 'cet4',
    mode: 'mock',
    genre: 'argument',
    title: 'Should College Students Take Part-time Jobs?',
    prompt: '有同学认为兼职可以锻炼能力、减轻家庭负担，也有人担心影响学业。请写一篇短文谈谈你的看法。',
    outline: ['引出争议', '兼职的好处', '需要注意的问题', '你的结论'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2017 年 6 月 · 卷 B',
    year: 2017,
    model: {
      essay: `Whether college students should take part-time jobs has long been debated on campus.

Those who support it point out that a job teaches things no classroom can: how to deal with a customer, how to finish a task on time, and how to spend money earned by yourself. For students from poorer families, the income also matters. However, the opposite voice is worth listening to. A job that takes up thirty hours a week leaves little energy for reading, and some students fall behind without noticing.

In my opinion, a part-time job is valuable if it is chosen carefully and limited in hours. Ten to fifteen hours a week is reasonable, especially when the work is related to your major or your future career.

What we should avoid is not work itself, but work without a plan.`,
      highlights: [
        { phrase: 'has long been debated on campus', note: '引出长期争议' },
        { phrase: 'leaves little energy for reading', note: 'leave energy for 是描述影响的好搭配' },
        { phrase: 'What we should avoid is not … but …', note: '结尾用 not…but 收束立场' }
      ],
      structure: '争议 → 支持方两点（能力 + 收入）→ 反方风险 → 折中结论（10–15 小时、与专业相关）。'
    }
  },
  {
    id: 'c4w-m03',
    level: 'cet4',
    mode: 'mock',
    genre: 'chart',
    title: 'How Students Use the Library',
    prompt: '某高校调查显示，学生去图书馆的目的为：自习 55%、借书 25%、查阅电子资源 15%、其他 5%。请描述数据并说明你的看法。',
    outline: ['一句话说明调查', '分项描述数据', '对图书馆使用的看法或建议'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2018 年 6 月 · 卷 A',
    year: 2018,
    model: {
      essay: `A recent survey of 600 students in a university shows why they go to the library.

More than half of them, about fifty-five percent, go there mainly to study on their own. A quarter borrow printed books, and fifteen percent use electronic resources such as databases and online journals. The remaining five percent give other reasons, from group discussion to simply resting in a quiet place.

The figures tell us something important: the library has become a place for quiet study rather than a storehouse of books. In my opinion, universities should respond to this change. More reading seats and power outlets are needed, and the electronic resources should be easier to find, because students who never enter the shelves still need guidance on where to search.

A library that follows its readers will always be a busy one.`,
      highlights: [
        { phrase: 'A quarter borrow printed books', note: '用分数替数字，避免整段都是百分比' },
        { phrase: 'a place for quiet study rather than a storehouse of books', note: '对数据做一句定性' },
        { phrase: 'A library that follows its readers', note: '结尾回扣主题的短句' }
      ],
      structure: '总述 → 四个数据分两档 → 一句解读 → 两条建议 → 收尾。'
    }
  },
  {
    id: 'c4w-m04',
    level: 'cet4',
    mode: 'mock',
    genre: 'letter',
    title: 'Introducing a Chinese Festival to a Friend',
    prompt: '你的外国朋友对中国传统节日很感兴趣，请写信介绍一个你熟悉的节日，说明它的时间、习俗和意义。',
    outline: ['写信目的', '节日时间与习俗', '节日的意义', '邀请他来体验'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2019 年 6 月 · 卷 B',
    year: 2019,
    model: {
      essay: `Dear David,

I was glad to hear that you are curious about Chinese festivals. Let me tell you about the Mid-Autumn Festival, which falls on the fifteenth day of the eighth lunar month.

On that evening families gather in the open air, eat mooncakes and look at the full moon. Children carry small lanterns, and older people tell the story of Chang'e, the lady who flew to the moon. Mooncakes are round, and the shape stands for reunion, which is the heart of the festival.

For me, the day means going home. However busy the term is, my parents and I sit at the same table and share one mooncake cut into pieces.

If you come to China in September, I would be happy to take you to my hometown and celebrate it with my family.

Yours,
Li Ming`,
      highlights: [
        { phrase: 'falls on the fifteenth day of the eighth lunar month', note: '说农历日期的固定表达' },
        { phrase: 'the shape stands for reunion', note: '解释象征意义' },
        { phrase: 'However busy the term is', note: '让步状语从句，位置灵活' }
      ],
      structure: '书信：回信目的 → 时间与习俗 → 意义 → 个人感受 → 邀请。'
    }
  },
  {
    id: 'c4w-m05',
    level: 'cet4',
    mode: 'mock',
    genre: 'argument',
    title: 'Garbage Sorting on Campus',
    prompt: '许多高校开始推行垃圾分类。请写一篇短文，说明分类的意义以及推行中可能遇到的困难，并提出建议。',
    outline: ['现象介绍', '意义', '困难', '建议'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2020 年 9 月 · 卷 A',
    year: 2020,
    model: {
      essay: `Garbage sorting has moved from a poster on the wall to a daily task in many universities.

The purpose is simple and important. When waste is sorted at the source, recyclable paper and plastic can be reused, and harmful items such as batteries no longer pollute the soil. Sorting also trains a habit that students will carry into their adult lives.

The difficulty, however, should not be underestimated. In the first weeks, people stand in front of four bins and cannot decide where a milk tea cup belongs. Rules differ from city to city, and reminders fade quickly.

My suggestion is to make the first step easy. Put a small card with three common examples above each bin, and let student volunteers answer questions during the lunch hour. Once the first week is over, most people sort without thinking.`,
      highlights: [
        { phrase: 'from a poster on the wall to a daily task', note: '对比式开头，交代变化' },
        { phrase: 'should not be underestimated', note: '书面语，提醒读者重视' },
        { phrase: 'Once the first week is over', note: '时间状语从句，带出习惯养成的节奏' }
      ],
      structure: '现象 → 意义两点 → 困难（规则不熟、提醒易衰减）→ 具体建议 → 收束。'
    }
  },
  {
    id: 'c4w-m06',
    level: 'cet4',
    mode: 'mock',
    genre: 'argument',
    title: 'Cashless Life: Convenience and Risk',
    prompt: '移动支付已经深入日常生活。请写一篇短文，谈谈它带来的便利与需要注意的风险。',
    outline: ['现象', '便利之处', '风险', '你的态度'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2021 年 6 月 · 卷 A',
    year: 2021,
    model: {
      essay: `In most Chinese cities today, a phone is enough for a whole day: breakfast, a bus ride, a cinema ticket and even a beggar's cup.

The convenience is obvious. Payment takes two seconds, queues are shorter, and small shops no longer worry about change. For students living on a monthly budget, the record of every payment also makes spending visible.

Yet a cashless life has its own risks. If the phone is lost or the battery dies, a person may find himself unable to buy a bottle of water. Personal information can leak through careless links, and some elderly people are left behind by a system they never learned.

My view is that we should enjoy the speed but keep a backup. Carrying a little cash and checking payment records once a week are small habits that make a cashless life safer.`,
      highlights: [
        { phrase: 'a phone is enough for a whole day', note: '用具体场景代替抽象议论' },
        { phrase: 'are left behind by a system', note: 'leave sb behind 描述被落下' },
        { phrase: 'enjoy the speed but keep a backup', note: '对仗式结尾，观点清楚' }
      ],
      structure: '场景开头 → 便利（两三点）→ 风险（断电、信息、老人）→ 态度（享受但留后手）。'
    }
  },
  {
    id: 'c4w-m07',
    level: 'cet4',
    mode: 'mock',
    genre: 'argument',
    title: 'Why Volunteer Work Matters',
    prompt: '越来越多的大学生参加志愿服务。请写一篇短文，说明志愿服务的价值，并结合自身谈谈你的打算。',
    outline: ['现象', '志愿服务的价值', '你的经历或打算', '总结'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2022 年 12 月 · 卷 B',
    year: 2022,
    model: {
      essay: `Volunteer work has become a familiar sight on campus: students teaching children in the neighbourhood, guiding visitors in museums, or cleaning the riverside on weekends.

Its value goes far beyond the hours recorded on a certificate. Volunteers learn to communicate with strangers, to solve problems with limited resources, and to see a city from a side that textbooks never show. A student who has taught a ten-year-old to read will understand patience in a way no lecture can offer.

As for me, I plan to join the reading programme in the community library next term. I will go there twice a week and help children choose books. It is a small task, but it fits what I can do well.

Giving time is not a loss; it is the cheapest way to grow.`,
      highlights: [
        { phrase: 'goes far beyond the hours recorded on a certificate', note: '超越功利层面的表达' },
        { phrase: 'see a city from a side that textbooks never show', note: '具体化的价值论证' },
        { phrase: 'Giving time is not a loss; it is the cheapest way to grow.', note: '对仗收尾，适合背诵' }
      ],
      structure: '现象三例 → 价值（能力 + 视角）→ 我的计划 → 金句式收束。'
    }
  },
  {
    id: 'c4w-m08',
    level: 'cet4',
    mode: 'mock',
    genre: 'chart',
    title: 'Reading Habits of College Students',
    prompt: '调查显示，大学生平均每天用于阅读的时间为：手机阅读 46 分钟、纸质书 21 分钟、专业文献 18 分钟。请描述数据并说明你的看法。',
    outline: ['说明调查与总体情况', '分项数据', '解读与建议'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2023 年 6 月 · 卷 A',
    year: 2023,
    model: {
      essay: `A survey of college students reports how much time they spend reading each day.

Reading on a phone takes the largest share, about forty-six minutes, while printed books receive twenty-one minutes and academic papers only eighteen. In other words, students read a lot, but most of it is short and fragmented.

This is worth thinking about. Phone reading is convenient and often useful, yet it is designed for quick attention: a piece of news, a post, a comment, then the next one. Long reading, whether a novel or a paper, trains a different ability, the patience to follow an argument to its end.

I would suggest a simple habit: keep twenty minutes a day for something longer than a screen, and write one sentence about what you read. Small as it is, the habit changes how we think.`,
      highlights: [
        { phrase: 'takes the largest share', note: '描述占比最高的一项' },
        { phrase: 'short and fragmented', note: '两个形容词概括阅读特征' },
        { phrase: 'Small as it is', note: 'as 引导的让步倒装，句式加分' }
      ],
      structure: '总述 → 三组数据 → 定性（多而碎）→ 对比长阅读的能力 → 一个可执行建议。'
    }
  },
  {
    id: 'c4w-m09',
    level: 'cet4',
    mode: 'mock',
    genre: 'argument',
    title: 'How to Build a Healthier Campus Life',
    prompt: '熬夜、久坐、外卖成为不少大学生的日常。请写一篇短文，分析原因并提出改善建议。',
    outline: ['现象', '原因两点', '建议两点', '总结'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2024 年 6 月 · 卷 B',
    year: 2024,
    model: {
      essay: `Late nights, long hours of sitting and food ordered to the dormitory have become ordinary scenes on campus.

Two reasons stand out. First, the timetable is loose: without a fixed class in the morning, bedtime slides later week by week. Second, exercise rarely happens by accident in a city campus; it has to be planned, and planning is exactly what tired students skip.

To change this, the first step should be small enough to keep. Going to bed before midnight three days a week is easier to promise than every day. The second step is to attach exercise to something already fixed: walk to the canteen instead of taking the bus, or climb the stairs to the fourth floor.

Health is not built in a heroic week; it is built in ordinary ones.`,
      highlights: [
        { phrase: 'exercise rarely happens by accident', note: '抽象原因写得具体' },
        { phrase: 'small enough to keep', note: '形容建议「小到能坚持」，很有说服力' },
        { phrase: 'not built in a heroic week', note: '对比「一周猛练」与「日常积累」' }
      ],
      structure: '现象 → 两条原因（作息松、运动要计划）→ 两条可执行建议 → 收束。'
    }
  },
  {
    id: 'c4w-m10',
    level: 'cet4',
    mode: 'mock',
    genre: 'letter',
    title: 'A Letter to the Campus Newspaper',
    prompt: '校报正在征集关于「共享单车管理」的读者来信。请写一封信，反映你看到的问题并提出解决办法。',
    outline: ['写信目的', '你看到的问题', '两条解决办法', '期待回复'],
    wordRange: [120, 180],
    minutes: 30,
    source: '2025 年 6 月 · 卷 A',
    year: 2025,
    model: {
      essay: `Dear Editor,

I am writing to share a problem that many students have noticed: shared bikes are piling up at the gates of our campus.

At eight in the morning, the space in front of the south gate is crowded with bikes, and some are simply left on the pavement, blocking wheelchairs and delivery carts. After class, the same bikes are gone, and students who need one cannot find any.

Two simple measures may help. First, the university could mark two parking zones, one near the gate and one beside the library, and ask the bike companies to move the extra bikes once a day. Second, an in-app reminder before the end of a ride would cost nothing and reach every user.

I hope the newspaper can draw attention to this small but daily annoyance.

Yours,
Li Ming`,
      highlights: [
        { phrase: 'are piling up at the gates', note: '用具体画面描述问题' },
        { phrase: 'would cost nothing and reach every user', note: '给建议附上成本与覆盖面' },
        { phrase: 'small but daily annoyance', note: '对问题的准确定性' }
      ],
      structure: '读者来信：目的 → 现象（早高峰堆车）→ 两条办法 → 期待。'
    }
  }
]
