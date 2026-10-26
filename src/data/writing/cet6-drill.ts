import type { WritingTask } from '../../core/writing'

/**
 * 六级写作 · 专项训练（10 题）。
 * 每题聚焦一个更书面化的功能段落：趋势描述、观点论证、摘要、投诉信、讲座通知、提案……
 */
export const CET6_DRILL: WritingTask[] = [
  {
    id: 'c6w-d01',
    level: 'cet6',
    mode: 'drill',
    genre: 'chart',
    title: 'Describing a Trend',
    prompt: '某平台统计，2019 至 2023 年在线课程注册人数由 1200 万增至 4300 万。用一段话描述这一趋势并给出两种可能原因。',
    outline: ['一句话概括趋势', '给出两个具体数字或倍数', '两种可能原因'],
    wordRange: [80, 110],
    minutes: 18,
    model: {
      essay: `The number of online course registrations rose sharply from 12 million in 2019 to 43 million in 2023, more than tripling within four years.

Two factors may explain the surge. First, the pandemic forced schools and companies to move teaching online almost overnight, and many users stayed after it ended. Second, platforms lowered the barrier to entry: a course can now be started on a phone, paused at will and resumed weeks later.

The trend suggests that online learning has moved from an emergency solution to a routine option.`,
      highlights: [
        { phrase: 'more than tripling within four years', note: '分词短语补充倍数，比 rose by 258% 好读' },
        { phrase: 'lowered the barrier to entry', note: '降低门槛，经济与教育类文章高频' },
        { phrase: 'from an emergency solution to a routine option', note: '对趋势做定性判断' }
      ],
      structure: '趋势一句 → 数字/倍数 → 两条原因 → 一句定性，四句成段。'
    }
  },
  {
    id: 'c6w-d02',
    level: 'cet6',
    mode: 'drill',
    genre: 'argument',
    title: 'Will AI Take Away Our Jobs?',
    prompt: '有人担心人工智能会取代大量岗位。写一段短文表达你的判断，并用一个具体职业说明理由。',
    outline: ['点出担忧', '你的判断', '以一个职业为例说明', '一句收束'],
    wordRange: [100, 130],
    minutes: 18,
    model: {
      essay: `Fears that artificial intelligence will wipe out whole professions are exaggerated, at least in the short term.

Consider translation. Machine translation now handles routine documents well, yet demand for skilled translators has not collapsed; it has shifted towards legal contracts, medical reports and literary texts, where a wrong word carries real cost and a human must take responsibility. What changes is not the existence of the job but its content: less typing, more judgement.

The same pattern is likely elsewhere. AI removes tasks, not the need for someone accountable for the result. What matters is that we keep learning what the machine still cannot do.`,
      highlights: [
        { phrase: 'are exaggerated, at least in the short term', note: '给判断加时间限定，避免绝对' },
        { phrase: 'has shifted towards…', note: 'shift towards 描述需求结构变化' },
        { phrase: 'removes tasks, not the need for…', note: '对仗收束，观点清晰' }
      ],
      structure: '担忧 → 判断 → 一个职业的案例分析 → 提炼规律。'
    }
  },
  {
    id: 'c6w-d03',
    level: 'cet6',
    mode: 'drill',
    genre: 'argument',
    title: 'Writing an Abstract',
    prompt: '把下面这段研究改写成一段 90 词左右的英文摘要：研究者调查了 300 名大学生，发现每天阅读 30 分钟以上者睡眠质量更好，建议把阅读纳入作息安排。',
    outline: ['研究问题与方法', '主要发现', '结论或建议'],
    wordRange: [80, 100],
    minutes: 18,
    model: {
      essay: `This study examines the relationship between daily reading and sleep quality among college students. Data were collected from 300 undergraduates through a questionnaire covering reading time, bedtime and self-rated sleep quality.

The results show that students who read for more than thirty minutes a day reported significantly better sleep than those who read less than ten minutes, and the difference remained after controlling for bedtime.

The findings suggest that a short, regular reading routine may be a low-cost way to improve sleep, and universities could include it in daily schedules.`,
      highlights: [
        { phrase: 'Data were collected from…', note: '摘要常用被动语态，突出研究本身' },
        { phrase: 'remained after controlling for bedtime', note: '说明排除了混杂因素，学术味浓' },
        { phrase: 'a low-cost way to improve sleep', note: '把结论落到可操作的价值上' }
      ],
      structure: '摘要三段：目的与方法 → 发现 → 结论/建议，时态以一般现在时为主。'
    }
  },
  {
    id: 'c6w-d04',
    level: 'cet6',
    mode: 'drill',
    genre: 'proposal',
    title: 'A Proposal on Remote Work',
    prompt: '你所在的公司考虑每周允许一天远程办公。给部门经理写一份简短提案，说明好处、潜在问题与试行方案。',
    outline: ['提案目的', '好处与风险各一点', '试行方案（范围、周期、评估）'],
    wordRange: [100, 130],
    minutes: 18,
    model: {
      essay: `I would like to propose a three-month trial of one remote day per week for our team.

The benefit is mainly time: colleagues who commute for ninety minutes could start work at nine instead of ten thirty, and the quiet hours at home suit tasks that need deep concentration. The risk is coordination; decisions that need three people in a room can slow down when everyone is scattered.

I therefore suggest a trial limited to Wednesdays, with two rules: core meetings stay on Tuesday, and everyone posts a short daily update. At the end of the quarter we can compare output and response time before deciding whether to continue.`,
      highlights: [
        { phrase: 'I would like to propose a three-month trial', note: '提案开头直接给出范围与周期' },
        { phrase: 'The benefit is mainly time', note: '好处落到具体指标上' },
        { phrase: 'before deciding whether to continue', note: '把试验与决策绑定，专业感强' }
      ],
      structure: '提案：目的 → 好处 → 风险 → 试行方案（时间、规则、评估）。'
    }
  },
  {
    id: 'c6w-d05',
    level: 'cet6',
    mode: 'drill',
    genre: 'chart',
    title: 'Commuting in Big Cities',
    prompt: '一项调查显示，某市通勤方式占比为：地铁 41%、公交 23%、私家车 19%、骑行与步行 17%。描述数据并指出一个值得关注的问题。',
    outline: ['概括调查', '分项数据', '指出问题并给一句建议'],
    wordRange: [90, 120],
    minutes: 18,
    model: {
      essay: `A city survey on commuting shows that the underground carries the largest share at forty-one percent, followed by buses at twenty-three percent, private cars at nineteen percent and cycling or walking at seventeen.

Two observations stand out. Public transport, taken together, accounts for nearly two thirds of all trips, which is good news for both congestion and emissions. At the same time, the share of walking and cycling remains modest, although these are the cheapest and healthiest options for trips under three kilometres.

The city could encourage the last group by widening bike lanes and adding showers near office buildings.`,
      highlights: [
        { phrase: 'taken together, accounts for nearly two thirds', note: '分组汇总数据，避免逐条罗列' },
        { phrase: 'Two observations stand out.', note: '引出解读的过渡句' },
        { phrase: 'The city could encourage the last group by…', note: '针对数据给出一条可执行建议' }
      ],
      structure: '数据 → 两条观察（公共交通占比高、短途步行骑行少）→ 一条建议。'
    }
  },
  {
    id: 'c6w-d06',
    level: 'cet6',
    mode: 'drill',
    genre: 'argument',
    title: 'Lifelong Learning',
    prompt: '有人说「毕业才是学习的开始」。写一段议论，说明你同意还是不同意，并给出一个现实理由。',
    outline: ['引出说法', '你的立场', '现实理由（举一个行业例子）', '收束'],
    wordRange: [100, 130],
    minutes: 18,
    model: {
      essay: `The claim that graduation marks the beginning of learning sounds like a slogan, but it describes a real shift.

Take software development. A framework that was standard five years ago may now be maintained by nobody, and a developer who stops learning does not simply lose an advantage; he loses the ability to read his own company's code. The same is true in medicine, accounting and teaching, where the rules themselves move.

This does not mean everyone must return to a classroom. It means the habit of learning has to survive the loss of exams, and that is precisely what a degree cannot guarantee.`,
      highlights: [
        { phrase: 'sounds like a slogan, but it describes a real shift', note: '先抑后扬，把俗语落回现实' },
        { phrase: "he loses the ability to read his own company's code", note: '具体后果，比 lose competitiveness 有力' },
        { phrase: 'survive the loss of exams', note: '形象说法：学习习惯要经得起「没有考试」' }
      ],
      structure: '引语 → 立场 → 行业案例 → 提炼（习惯而非课堂）→ 收束。'
    }
  },
  {
    id: 'c6w-d07',
    level: 'cet6',
    mode: 'drill',
    genre: 'letter',
    title: 'A Complaint Letter',
    prompt: '你入住的酒店房间隔音很差、热水时有时无。写一封投诉信给酒店经理，说明问题、你受到的影响以及你希望的处理方式。',
    outline: ['入住信息与写信目的', '两个具体问题', '影响与期望的处理'],
    wordRange: [100, 130],
    minutes: 18,
    model: {
      essay: `Dear Manager,

I stayed in room 812 from 3 to 5 October and am writing to report two problems that made the stay disappointing.

First, the wall between my room and the corridor is so thin that every conversation and trolley passed through it; I woke three times on the first night. Second, the hot water came and went, and on the second morning I had to finish washing with cold water.

I had booked the room for a work trip and needed rest before an early meeting, so the disturbance had a direct effect on my schedule. I would appreciate a partial refund or a credit for a future stay, and I hope the hot water system can be checked before other guests arrive.

Yours sincerely,
Li Ming`,
      highlights: [
        { phrase: 'made the stay disappointing', note: '定调句，后面两个问题都围绕它' },
        { phrase: 'came and went', note: '描述时有时无，画面感强' },
        { phrase: 'I would appreciate a partial refund', note: '礼貌但明确地提要求' }
      ],
      structure: '投诉信：入住信息 → 两个问题（各一两句）→ 影响 → 明确诉求。'
    }
  },
  {
    id: 'c6w-d08',
    level: 'cet6',
    mode: 'drill',
    genre: 'notice',
    title: 'An Academic Lecture Notice',
    prompt: '学院将邀请一位教授做关于「城市与气候」的讲座。写一则通知，说明主题、时间地点、适合听众与报名方式。',
    outline: ['讲座主题与主讲人', '时间、地点、语言', '适合谁听与报名方式'],
    wordRange: [80, 110],
    minutes: 18,
    model: {
      essay: `Lecture Notice: Cities and Climate

Professor Chen Hui from the School of Urban Studies will give a lecture on how coastal cities are adapting to rising temperatures and more frequent floods.

The lecture will be held on Thursday, 12 November, from 2:00 to 3:30 p.m. in Room 305 of the Science Building. It will be delivered in English, with slides in both languages, and questions are welcome in the last twenty minutes.

The talk is open to all students, especially those working on environment, planning or public health projects. Please register by email before Wednesday so that we can prepare enough handouts.

The Student Academic Committee`,
      highlights: [
        { phrase: 'with slides in both languages', note: '通知里补足实用信息，体现考虑周全' },
        { phrase: 'questions are welcome in the last twenty minutes', note: '议程细节让通知可信' },
        { phrase: 'so that we can prepare enough handouts', note: '把报名要求与理由连起来' }
      ],
      structure: '通知：主题与主讲人 → 时间地点语言 → 适合对象 → 报名方式与理由。'
    }
  },
  {
    id: 'c6w-d09',
    level: 'cet6',
    mode: 'drill',
    genre: 'speech',
    title: 'A Short Speech on Sustainability',
    prompt: '你将在校园环保论坛上做两分钟发言，谈个人行动与系统改变的关系。写一段发言稿。',
    outline: ['开场提出问题', '个人行动的意义与局限', '呼吁两者结合'],
    wordRange: [100, 130],
    minutes: 18,
    model: {
      essay: `Good afternoon. Every time we talk about the environment, someone asks the same question: does my paper bag really matter?

It does, but not in the way we usually claim. One bag saves almost nothing; a habit shared by ten thousand students changes what the canteen orders next month. That is the real power of personal action: it moves demand, and demand moves systems.

Yet personal action is not enough on its own. If the recycling bins are far away and the lights never turn off, effort alone cannot fix it. So let us do both: carry the cup, and ask the university to put a bin on every floor.

Thank you.`,
      highlights: [
        { phrase: 'it does, but not in the way we usually claim', note: '先肯定再修正，演讲常用修辞' },
        { phrase: 'it moves demand, and demand moves systems', note: '链式因果，把个人与系统连起来' },
        { phrase: 'So let us do both', note: '口语化的呼吁，适合结尾' }
      ],
      structure: '开场提问 → 个人行动的作用 → 局限 → 呼吁「两件都做」。'
    }
  },
  {
    id: 'c6w-d10',
    level: 'cet6',
    mode: 'drill',
    genre: 'proposal',
    title: 'Saving Energy in the Dormitory',
    prompt: '宿舍楼用电量偏高。写一份提案，用一个数据说明现状，提出两条可执行措施，并说明如何衡量效果。',
    outline: ['现状（一个数据）', '两条措施', '衡量方式'],
    wordRange: [100, 130],
    minutes: 18,
    model: {
      essay: `Our dormitory building used 18 percent more electricity last winter than the year before, mostly during the hours when rooms were empty.

Two measures could reverse this. First, install motion sensors in corridor lighting, which is currently on twenty-four hours a day. Second, publish a weekly energy ranking by floor; nothing changes habits faster than a friendly comparison between neighbours.

To judge whether it works, we only need two figures: monthly consumption per floor and the number of rooms with lights left on at midnight. Both can be read from the existing meter and a ten-minute nightly check.

A proposal is only worth making if it can be measured.`,
      highlights: [
        { phrase: 'mostly during the hours when rooms were empty', note: '给数据补上时间细节，指向问题' },
        { phrase: 'nothing changes habits faster than…', note: '比较级强调措施有效性' },
        { phrase: 'A proposal is only worth making if it can be measured.', note: '收尾金句，呼应衡量指标' }
      ],
      structure: '现状数据 → 两条措施 → 衡量指标 → 金句式收尾。'
    }
  }
]
