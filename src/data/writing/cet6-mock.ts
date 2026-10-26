import type { WritingTask } from '../../core/writing'

/**
 * 六级写作 · 真题模拟（10 题）。
 * 按 2016–2026 各场次常见方向重写：社会议题、科技与教育、图表分析、书信与致辞。
 * source 标注对应场次的题型，材料与范文均为原创仿真。
 */
export const CET6_MOCK: WritingTask[] = [
  {
    id: 'c6w-m01',
    level: 'cet6',
    mode: 'mock',
    genre: 'argument',
    title: 'Short Videos and Our Attention',
    prompt: '短视频已成为主要的娱乐方式。请写一篇短文，分析它对注意力的影响，并提出你的看法。',
    outline: ['现象', '影响（正反）', '你的看法', '建议'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2016 年 12 月 · 卷 A',
    year: 2016,
    model: {
      essay: `A few taps on a phone now lead to hours of short videos, and few of us can say exactly where the time went.

The effect on attention is easy to underestimate. Short videos are designed to deliver a reward every fifteen seconds, so the mind grows used to constant change. After a week of such viewing, a forty-page chapter may feel unbearable not because it is difficult but because it does not change fast enough. On the other hand, the same format can teach: recipes, vocabulary and news reach people who would never open a textbook.

My view is that the problem lies less in the medium than in its default settings. A tool that keeps running until the battery dies has no natural end, and users must supply one.

A practical rule is to decide the ending before starting: three videos, then the app closes. Small boundaries restore the very attention the format trains us to lose.`,
      highlights: [
        { phrase: 'few of us can say exactly where the time went', note: '现象开头，暗含问题' },
        { phrase: 'not because it is difficult but because it does not change fast enough', note: 'not because…but because 揭示机制' },
        { phrase: 'has no natural end, and users must supply one', note: '把问题归因到产品设计，观点有深度' }
      ],
      structure: '现象 → 机制（奖励间隔）→ 正反两面 → 归因（默认设置）→ 具体规则。'
    }
  },
  {
    id: 'c6w-m02',
    level: 'cet6',
    mode: 'mock',
    genre: 'argument',
    title: 'AI in the Classroom',
    prompt: '生成式人工智能进入课堂，既能辅助学习，也可能代替思考。请写一篇短文，说明学校应如何应对。',
    outline: ['现状', '两点风险与一点机会', '学校的应对', '总结'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2018 年 6 月 · 卷 B',
    year: 2018,
    model: {
      essay: `Students now have a writing assistant that never tires, and schools are understandably unsure how to react.

Two risks deserve attention. First, the tool may replace the struggle that learning depends on: a student who asks for a finished paragraph skips the process of ordering ideas, which is where understanding forms. Second, assessment loses meaning if teachers cannot tell whose words they are reading. The opportunity is equally real: a patient tutor available at midnight can explain the same sentence five ways.

Schools should respond by changing the task rather than banning the tool. Oral defence of a written piece, in-class drafting and questions that require students to compare two sources all make the thinking visible. Clear rules on disclosure are also necessary, so that assistance is acknowledged instead of hidden.

Technology does not decide what a classroom values; its rules do. If schools teach students to think before they prompt, the tool becomes a tutor rather than a shortcut.`,
      highlights: [
        { phrase: 'the struggle that learning depends on', note: '把「困难」重新定义为学习的必要环节' },
        { phrase: 'whose words they are reading', note: '点出评价体系的核心困境' },
        { phrase: 'Technology does not decide what a classroom values; its rules do.', note: '对仗收尾，观点清晰' }
      ],
      structure: '现状 → 两个风险 → 一个机会 → 学校应对（改任务 + 明规则）→ 收束。'
    }
  },
  {
    id: 'c6w-m03',
    level: 'cet6',
    mode: 'mock',
    genre: 'chart',
    title: 'Urbanisation in China',
    prompt: '统计显示，中国城镇化率由 2010 年的 50% 升至 2023 年的 66%。请描述趋势，分析两点影响，并提出一点建议。',
    outline: ['趋势与数据', '两点影响', '一条建议'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2019 年 12 月 · 卷 A',
    year: 2019,
    model: {
      essay: `China's urbanisation rate climbed from fifty percent in 2010 to sixty-six percent in 2023, which means more than two hundred million people moved from villages to cities within thirteen years.

The effects run in two directions. On the positive side, cities concentrate jobs, hospitals and schools, and the average income of a migrant worker is far higher than what farmland could offer. On the negative side, housing and transport struggle to keep pace. Rents rise faster than wages, and a morning commute of one hour becomes normal.

The lesson is not to slow the process but to plan it better. New urban districts should be built around public transport, with schools and clinics within walking distance, so that growth does not simply move congestion from the old centre to the new edge.

Urbanisation is inevitable; congestion is a choice. The next decade will test whether city budgets follow that principle.`,
      highlights: [
        { phrase: 'moved from villages to cities within thirteen years', note: '把百分比换算成人，读者更有体感' },
        { phrase: 'The effects run in two directions.', note: '引出正反两面的过渡句' },
        { phrase: 'Urbanisation is inevitable; congestion is a choice.', note: '对仗式结论' }
      ],
      structure: '数据 + 换算 → 正面影响 → 负面影响 → 建议（以公共交通组织新区）→ 结论。'
    }
  },
  {
    id: 'c6w-m04',
    level: 'cet6',
    mode: 'mock',
    genre: 'argument',
    title: 'Work-life Balance in a Fast Economy',
    prompt: '「996」与「躺平」同时成为热词。请写一篇短文，分析这一矛盾，并谈谈年轻人应如何选择。',
    outline: ['两种现象', '矛盾根源', '你的建议', '总结'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2021 年 12 月 · 卷 B',
    year: 2021,
    model: {
      essay: `Two phrases have dominated discussions among young workers: working "996", and lying flat. They look like opposites, yet both are responses to the same pressure.

The root of the conflict is that effort and reward have drifted apart. When extra hours once promised a promotion, a person could choose to work hard; when they promise only survival in a crowded market, the same hours feel like a trap. Some respond by racing harder, others by stepping out of the race altogether.

I would suggest a third path: negotiate the terms of effort rather than its total amount. Ask what a project will be judged on, protect one evening a week that nothing may take, and treat rest as part of the work rather than a reward for it.

Neither burning out nor dropping out solves the underlying problem; a clearer agreement does. Such an agreement is rarely offered; it has to be asked for, and asked early.`,
      highlights: [
        { phrase: 'effort and reward have drifted apart', note: '用一个短语概括矛盾根源' },
        { phrase: 'negotiate the terms of effort rather than its total amount', note: '提出可操作的第三条路' },
        { phrase: 'Neither burning out nor dropping out', note: '否定并列，收尾有力' }
      ],
      structure: '两种热词 → 根源（付出与回报脱节）→ 两种极端 → 第三条路（谈条件、保休息）→ 结论。'
    }
  },
  {
    id: 'c6w-m05',
    level: 'cet6',
    mode: 'mock',
    genre: 'argument',
    title: 'The Digital Divide',
    prompt: '公共服务越来越多地转移到线上。请写一篇短文，分析这对老年人和农村居民的影响，并提出解决思路。',
    outline: ['现象', '两类人的处境', '解决思路两点', '总结'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2017 年 12 月 · 卷 B',
    year: 2017,
    model: {
      essay: `Buying a train ticket, seeing a doctor or applying for a subsidy increasingly requires a smartphone, and this shift has quietly excluded those who never learned to use one.

For many elderly people, the barrier is not intelligence but interface: small print, timed screens and passwords they cannot remember. For rural residents, the obstacle is often the connection itself, and a hospital appointment system that assumes stable video calls simply does not work in a mountain village.

Two responses seem practical. Public services should keep a human counter for every task that can be done online, and staff should be trained to help rather than redirect. Meanwhile, community classes that pair a young volunteer with an older learner do more than teach taps; they build a person to ask.

Convenience that leaves people behind is not progress. A counter, a volunteer and a printed form cost little; excluding a generation costs far more.`,
      highlights: [
        { phrase: 'the barrier is not intelligence but interface', note: '把偏见纠正成设计问题，立意更高' },
        { phrase: 'a hospital appointment system that assumes…', note: '用具体系统说明「默认条件」的排斥' },
        { phrase: 'Convenience that leaves people behind is not progress.', note: '对仗收尾' }
      ],
      structure: '现象 → 老人与农村两类处境 → 两条解决思路 → 收束。'
    }
  },
  {
    id: 'c6w-m06',
    level: 'cet6',
    mode: 'mock',
    genre: 'argument',
    title: 'Why Academic Integrity Matters',
    prompt: '学术不端事件屡见报端。请写一篇短文，分析原因，并说明为什么诚信对研究者本人最重要。',
    outline: ['现象', '两点原因', '对研究者本人的意义', '总结'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2022 年 6 月 · 卷 A',
    year: 2022,
    model: {
      essay: `Retractions and plagiarism cases appear in the news often enough that academic integrity is no longer a topic for seminars alone.

The causes are partly structural. Promotion depends on the number of papers, and a slow, careful study competes badly with three quick ones. The causes are also personal: a student who has never been taught how to quote properly may copy a paragraph without realising it is wrong.

But the strongest argument for honesty is not the penalty; it is that the researcher lives with the result. Data that were invented have to be defended for years, and a conclusion that was borrowed becomes a wall the author cannot walk through later. Honest work is slower, yet it can be extended.

A reputation is built on a thousand small correct decisions. One careless paragraph can undo them, and no citation format can repair the loss of trust.`,
      highlights: [
        { phrase: 'competes badly with three quick ones', note: '把制度压力写成竞争关系' },
        { phrase: 'a wall the author cannot walk through later', note: '比喻说明造假阻碍后续研究' },
        { phrase: 'a thousand small correct decisions', note: '把抽象诚信落到日常选择上' }
      ],
      structure: '现象 → 原因（制度 + 训练）→ 对研究者本人的意义 → 收束。'
    }
  },
  {
    id: 'c6w-m07',
    level: 'cet6',
    mode: 'mock',
    genre: 'argument',
    title: 'Passing on Traditional Culture',
    prompt: '年轻人对传统文化兴趣回升，但传承仍面临困难。请写一篇短文，分析原因并提出两条可行的传承方式。',
    outline: ['现象', '困难原因', '两条可行方式', '总结'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2023 年 12 月 · 卷 B',
    year: 2023,
    model: {
      essay: `Museums are crowded on weekends, and hanfu photographs fill social feeds; interest in traditional culture has clearly returned. Whether it is passed on is a different question.

The difficulty lies in the gap between admiring and practising. A visitor may love the look of a craft but never learn it, because the training takes years and the market rewards speed. Meanwhile, many traditions are tied to a way of life that has changed: the songs that accompanied farm work lose their setting when the fields are gone.

Two approaches seem to work. One is to keep the technique and change the product: a lacquer workshop that makes phone cases has trained more young apprentices than many classrooms. The other is to let the tradition answer a present need, such as a festival ritual adapted for city neighbourhoods.

Culture survives when people use it, not when it is preserved behind glass.`,
      highlights: [
        { phrase: 'the gap between admiring and practising', note: '提炼出核心矛盾' },
        { phrase: 'keep the technique and change the product', note: '对仗式，给出第一条路径' },
        { phrase: 'not when it is preserved behind glass', note: '结尾对比，点出「活态传承」' }
      ],
      structure: '现象 → 困难（欣赏与练习的落差、生活场景消失）→ 两条路径 → 结论。'
    }
  },
  {
    id: 'c6w-m08',
    level: 'cet6',
    mode: 'mock',
    genre: 'chart',
    title: 'Renewable Energy in the Grid',
    prompt: '数据显示，某省可再生能源发电占比由 2015 年的 12% 升至 2023 年的 34%。请描述趋势，分析两点挑战，并给出一条政策建议。',
    outline: ['趋势与数据', '两点挑战', '一条政策建议'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2024 年 12 月 · 卷 A',
    year: 2024,
    model: {
      essay: `The share of renewable energy in the province's grid rose from twelve percent in 2015 to thirty-four percent in 2023, a near tripling in eight years.

Two challenges accompany such a rise. The first is intermittency: wind and sunlight cannot be ordered, so a cloudy, windless evening may force the grid to restart gas turbines that had been idle. The second is geography: the best wind sits in the north, the largest demand in the south, and transmission lines cross provinces, budgets and interests.

A practical response is to pay for flexibility rather than only for generation. Storage facilities and demand-response programmes, which reward factories for shifting work to sunny hours, can absorb much of the fluctuation. Revised pricing, not simply more panels, is what the next stage requires.

A clean grid is less about adding sources than about managing them. The province that learns to move demand will need fewer turbines for the same job.`,
      highlights: [
        { phrase: 'cannot be ordered, so a cloudy, windless evening may force…', note: '把间歇性讲成具体场景' },
        { phrase: 'cross provinces, budgets and interests', note: '三项并列，写出协调难度' },
        { phrase: 'less about adding sources than about managing them', note: 'less about…than about 提出核心判断' }
      ],
      structure: '数据 → 两个挑战（间歇性、地理）→ 政策建议（为灵活性付费）→ 结论。'
    }
  },
  {
    id: 'c6w-m09',
    level: 'cet6',
    mode: 'mock',
    genre: 'letter',
    title: 'A Letter on Corporate Responsibility',
    prompt: '某企业因排放问题被居民投诉。请你以社区代表身份写信给企业负责人，说明影响、提出要求，并建议建立沟通机制。',
    outline: ['写信身份与目的', '具体影响', '两点要求', '沟通机制建议'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2025 年 12 月 · 卷 B',
    year: 2025,
    model: {
      essay: `Dear Mr. Zhao,

I am writing on behalf of the residents of Green Lake Community, which lies less than a kilometre from your plant.

Since the new production line began operating in March, many families have reported a chemical smell in the evening, and the number of complaints to the neighbourhood office has risen from two a month to nearly twenty. Our concern is not only comfort: several children have developed coughs that their parents link to the air.

We therefore ask two things. First, please publish the emission readings of the new line, updated monthly. Second, please invite an independent team to test the air at three points around the plant. We would also welcome a quarterly meeting at which residents can raise questions directly with your environmental officer.

We are not asking you to close the plant; we are asking to breathe safely while it runs.

Yours sincerely,
Li Ming, on behalf of Green Lake Community`,
      highlights: [
        { phrase: 'risen from two a month to nearly twenty', note: '用对比数字说明问题严重性' },
        { phrase: 'We are not asking you to close the plant', note: '先划清诉求边界，降低对抗' },
        { phrase: 'a quarterly meeting at which residents can raise questions', note: '给机制而非只给情绪' }
      ],
      structure: '身份与目的 → 影响（气味、投诉量、孩子咳嗽）→ 两点要求 → 沟通机制 → 立场收尾。'
    }
  },
  {
    id: 'c6w-m10',
    level: 'cet6',
    mode: 'mock',
    genre: 'speech',
    title: 'A Speech on Starting a Business',
    prompt: '你将在毕业生创业论坛上发言。写一段发言稿，谈年轻人创业应具备的一种心态，并举例说明。',
    outline: ['开场与观点', '一个具体例子', '对听众的行动建议', '收束'],
    wordRange: [150, 200],
    minutes: 30,
    source: '2020 年 12 月 · 卷 B',
    year: 2020,
    model: {
      essay: `Good morning, everyone. If I could give young founders only one piece of advice, it would be this: fall in love with the problem, not with your solution.

Let me explain with a small example. Two graduates noticed that students waste food because canteens close before evening classes end. The first team built a beautiful app with four months of design and launched it after the exams had finished. The second team started with a whiteboard at the exit: anything you will not eat, leave here. By the third week, a shelf of untouched fruit had appeared, and only then did they write code to track it.

The difference was not talent but order: they tested the problem before they sold the answer. So before your next pitch, go and watch five real users. Count how long they take, and ask them what they do instead. That hour will teach you more than any business plan.

Thank you.`,
      highlights: [
        { phrase: 'fall in love with the problem, not with your solution', note: '一句可记的核心主张' },
        { phrase: 'launched it after the exams had finished', note: '细节点出时机错误' },
        { phrase: 'go and watch five real users', note: '把建议落到可执行的行动上' }
      ],
      structure: '开场观点 → 双团队对比案例 → 提炼（先验证问题再写代码）→ 行动建议 → 致谢。'
    }
  }
]
