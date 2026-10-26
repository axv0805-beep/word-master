import type { ListeningItem } from '../../core/listening'

/**
 * 六级听力 · 真题模拟题库（2016–2026 场景仿真）。
 *
 * 说明：材料按历年六级听力真题的题材、篇幅与设问方式重新撰写，
 * `source` 只标注对应场次风格，不逐字复制真题原文（真题音频另有版权）。
 */

export const CET6_MOCK: ListeningItem[] = [
  {
    id: 'c6-m01',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2016 年 6 月 · 卷 A',
    year: 2016,
    material: [
      { speaker: 'W', text: 'Professor Hall, you have studied cities for thirty years. What changed most?' },
      { speaker: 'M', text: 'The distance people will travel for work. It used to be an hour each way. Now some accept two, if the salary is right.' },
      { speaker: 'W', text: 'Does that not make transport the real issue?' },
      { speaker: 'M', text: 'It always was. Housing policy is transport policy wearing a different hat.' }
    ],
    stem: 'What does the professor mean by the last sentence?',
    options: [
      'Housing and transport problems are closely connected.',
      'Transport policy should be handled by housing officials.',
      'People care more about housing than about transport.',
      'City governments wear unusual clothing at meetings.'
    ],
    answer: 0,
    explain: '「Housing policy is transport policy wearing a different hat」是比喻：住房问题本质上就是交通问题，两者是一回事。',
    summary: '教授说城市最大的变化是人们愿意为工作通勤多久；在他眼里，住房政策其实就是换了件外衣的交通政策。'
  },
  {
    id: 'c6-m02',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    source: '2016 年 12 月 · 卷 B',
    year: 2016,
    material: [
      { speaker: 'N', text: 'When researchers ask people how much they sleep, the answers are unreliable. People round up.' },
      { speaker: 'N', text: 'Devices that measure movement are better but still guess. The most accurate method remains a laboratory, and nobody sleeps well there.' },
      { speaker: 'N', text: 'So sleep science advances slowly, not because the question is unimportant, but because the measurement is intrusive.' }
    ],
    stem: 'Why does sleep science advance slowly according to the passage?',
    options: [
      'People are unwilling to discuss sleep.',
      'Measuring sleep accurately disturbs the sleeper.',
      'Sleep is considered an unimportant subject.',
      'Laboratories refuse to share their data.'
    ],
    answer: 1,
    explain: '「the measurement is intrusive」——最准的方法是进实验室，可没人能在实验室睡好，测量本身干扰睡眠。',
    summary: '自报睡眠时间不可靠、设备只能猜，最准的还是实验室，而在实验室睡不好——睡眠研究进展慢是因为测量本身干扰太大。'
  },
  {
    id: 'c6-m03',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2017 年 6 月 · 卷 A',
    year: 2017,
    material: [
      { speaker: 'M', text: 'The library wants to remove half the print journals and keep only the digital copies.' },
      { speaker: 'W', text: 'Have they asked the departments?' },
      { speaker: 'M', text: 'They ran a survey. Most staff said they prefer digital.' },
      { speaker: 'W', text: 'Which staff? The ones who already work on screen. Ask the historians who read margins.' }
    ],
    stem: 'What does the woman imply about the survey?',
    options: [
      'It was too short to be useful.',
      'It only reached staff who already prefer digital reading.',
      'It was sent to the wrong departments.',
      'It ignored the cost of digital copies.'
    ],
    answer: 1,
    explain: '「The ones who already work on screen. Ask the historians who read margins」——问卷主要问到本来就习惯屏幕阅读的人。',
    summary: '图书馆想砍掉一半纸质期刊只留电子版，调查显示多数人喜欢电子版；女士质疑样本：习惯屏幕的人当然选电子版，该问会看页边批注的历史学者。'
  },
  {
    id: 'c6-m04',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    source: '2017 年 12 月 · 卷 B',
    year: 2017,
    material: [
      { speaker: 'N', text: 'Many companies now publish an annual sustainability report. The reports are long, illustrated, and rarely read.' },
      { speaker: 'N', text: 'Investors look at two numbers: emissions per unit sold, and the money spent fixing problems.' },
      { speaker: 'N', text: 'Everything else, one fund manager said, is advertising.' }
    ],
    stem: 'What do investors focus on in sustainability reports?',
    options: [
      'The length and design of the report.',
      'Emissions per unit sold and the cost of fixes.',
      'The number of photographs included.',
      'The company\'s advertising budget.'
    ],
    answer: 1,
    explain: '「Investors look at two numbers: emissions per unit sold, and the money spent fixing problems」。',
    summary: '企业年年发很长的可持续报告，但投资人只看两个数字：单位销量排放与治污投入，其余都被当成广告。'
  },
  {
    id: 'c6-m05',
    level: 'cet6',
    mode: 'mock',
    section: '讲座',
    source: '2018 年 6 月 · 卷 A',
    year: 2018,
    material: [
      { speaker: 'N', text: 'There is a useful distinction between a mistake and an error. A mistake is a wrong action with a right intention. An error is a wrong belief.' },
      { speaker: 'N', text: 'Training can fix mistakes quickly, because the person already wants the right outcome.' },
      { speaker: 'N', text: 'Errors take longer, because you must first show that the belief is wrong.' }
    ],
    stem: 'What makes errors harder to correct than mistakes?',
    options: [
      'People who make errors do not care about the outcome.',
      'The underlying belief must first be shown to be wrong.',
      'Errors always cause more damage.',
      'Errors cannot be corrected by training.'
    ],
    answer: 1,
    explain: '「Errors take longer, because you must first show that the belief is wrong」——要先让当事人相信自己的认知错了。',
    summary: '错误分两类：动作错（意图对）与认知错（判断错）。动作错好纠正，认知错要先让人承认自己的信念有误。'
  },
  {
    id: 'c6-m06',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2018 年 12 月 · 卷 B',
    year: 2018,
    material: [
      { speaker: 'W', text: 'Our hospital wants to reduce the number of tests ordered at night.' },
      { speaker: 'M', text: 'Is that not dangerous? Some conditions only show up then.' },
      { speaker: 'W', text: 'The data say most night tests are repeats, ordered by colleagues who cannot see the earlier result.' },
      { speaker: 'M', text: 'Then the problem is access to records, not the tests themselves.' }
    ],
    stem: 'What does the man conclude?',
    options: [
      'Night testing should be banned entirely.',
      'The real problem is access to existing test results.',
      'Patients should be tested more often at night.',
      'Doctors should work shorter night shifts.'
    ],
    answer: 1,
    explain: '「the problem is access to records, not the tests themselves」——夜间重复检查多因看不到白天的结果。',
    summary: '医院想减少夜间检查，医生担心漏诊；数据显示夜间多是重复检查，原因是看不到此前的记录。'
  },
  {
    id: 'c6-m07',
    level: 'cet6',
    mode: 'mock',
    section: '新闻',
    source: '2019 年 6 月 · 卷 A',
    year: 2019,
    material: [
      { speaker: 'N', text: 'A national rail operator will stop selling tickets at station counters in forty small stations from next spring.' },
      { speaker: 'N', text: 'Passengers will buy on the app, or from a machine where one is installed.' },
      { speaker: 'N', text: 'Passenger groups warn that older travellers and those without smartphones will be left behind.' }
    ],
    stem: 'What concern do passenger groups raise?',
    options: [
      'Ticket prices will rise sharply.',
      'Older travellers and people without smartphones may be excluded.',
      'Machines are too expensive to install.',
      'Trains will run less frequently.'
    ],
    answer: 1,
    explain: '「older travellers and those without smartphones will be left behind」——被落在后面。',
    summary: '铁路公司明年春天起在 40 个小站停售人工柜台票，改手机或自助机；乘客组织担忧老人和无智能机的人被甩下。'
  },
  {
    id: 'c6-m08',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    source: '2019 年 12 月 · 卷 B',
    year: 2019,
    material: [
      { speaker: 'N', text: 'In a well-known experiment, people were asked to choose a jam from a display of twenty-four, or from one of six.' },
      { speaker: 'N', text: 'More people stopped at the large display, but far more bought from the small one.' },
      { speaker: 'N', text: 'The result is often summarised as "choice paralyses" — though later studies found the effect smaller than advertised.' }
    ],
    stem: 'What did later studies find about the jam experiment?',
    options: [
      'The effect was smaller than commonly reported.',
      'The experiment was never actually conducted.',
      'People preferred the large display.',
      'Price explained the whole difference.'
    ],
    answer: 0,
    explain: '「later studies found the effect smaller than advertised」——后续研究发现的效应比宣传的小。',
    summary: '著名果酱实验：24 种比 6 种更吸引人驻足，却卖得更少，被概括为「选择瘫痪」；但后续研究发现效应没那么大。'
  },
  {
    id: 'c6-m09',
    level: 'cet6',
    mode: 'mock',
    section: '讲座',
    source: '2020 年 9 月 · 卷 A',
    year: 2020,
    material: [
      { speaker: 'N', text: 'Historians of science often say that instruments do not simply measure the world; they define what counts as a measurement.' },
      { speaker: 'N', text: 'The thermometer did not settle a debate about heat. It created the vocabulary in which the debate could continue.' },
      { speaker: 'N', text: 'This is why the history of a tool is rarely only technical.' }
    ],
    stem: 'What point does the speaker make about the thermometer?',
    options: [
      'It ended all debate about the nature of heat.',
      'It supplied the vocabulary for further debate.',
      'It was invented by historians of science.',
      'It measured heat less accurately than earlier tools.'
    ],
    answer: 1,
    explain: '「It created the vocabulary in which the debate could continue」——没有终结争论，而是给出了继续争论的语汇。',
    summary: '科学史视角：仪器不只是测量，也在界定什么叫测量；温度计没有终结关于热的争论，而是提供了继续争论的词汇。'
  },
  {
    id: 'c6-m10',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2020 年 12 月 · 卷 B',
    year: 2020,
    material: [
      { speaker: 'M', text: 'The lab wants to apply for a grant to study urban noise.' },
      { speaker: 'W', text: 'That field is crowded. What would make yours different?' },
      { speaker: 'M', text: 'We would record at night, when the city is quiet, and compare the two.' },
      { speaker: 'W', text: 'Then say that in the first sentence. Reviewers read the first sentence twice.' }
    ],
    stem: 'What advice does the woman give?',
    options: [
      'Choose a less crowded research field.',
      'Put the distinctive method in the first sentence.',
      'Avoid studying noise at night.',
      'Ask a different lab for data.'
    ],
    answer: 1,
    explain: '「say that in the first sentence. Reviewers read the first sentence twice」——把最有辨识度的方法放在首句。',
    summary: '实验室要申请城市噪音研究经费，女士提醒领域拥挤，建议把「夜间录音做对比」这一独特方法写进申请首句。'
  },
  {
    id: 'c6-m11',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    source: '2021 年 6 月 · 卷 A',
    year: 2021,
    material: [
      { speaker: 'N', text: 'Factories that install robots often report a productivity rise in the first year, then nothing.' },
      { speaker: 'N', text: 'Researchers say the second effect is the important one. Gains stop when the old layout is kept.' },
      { speaker: 'N', text: 'The machine is new; the process around it is not.' }
    ],
    stem: 'Why do productivity gains eventually stop?',
    options: [
      'The robots break down frequently.',
      'The factory keeps its old working layout.',
      'Workers refuse to operate the robots.',
      'Demand for the products falls.'
    ],
    answer: 1,
    explain: '「Gains stop when the old layout is kept. The machine is new; the process around it is not.」',
    summary: '工厂上机器人第一年产量涨，之后停滞，原因是只换了机器、没改旧流程与布局。'
  },
  {
    id: 'c6-m12',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2021 年 12 月 · 卷 B',
    year: 2021,
    material: [
      { speaker: 'W', text: 'The company newsletter is being cut to one page a month.' },
      { speaker: 'M', text: 'Did anyone read it?' },
      { speaker: 'W', text: 'Two hundred people opened the last issue. That is five per cent.' },
      { speaker: 'M', text: 'Five per cent of whom? If it is the people who decide, that is not the same problem.' }
    ],
    stem: 'Why does the man question the five per cent figure?',
    options: [
      'The number of subscribers is unknown.',
      'Opening a newsletter does not mean it was read.',
      'The readers may be the decision-makers.',
      'Five per cent is too high to be true.'
    ],
    answer: 2,
    explain: '「If it is the people who decide, that is not the same problem」——如果这 5% 恰好是决策者，问题性质就不同。',
    summary: '内部通讯要缩成一月一页，因为上次只有 5% 打开；男士追问这 5% 是谁——若真是决策层，那就不算问题。'
  },
  {
    id: 'c6-m13',
    level: 'cet6',
    mode: 'mock',
    section: '讲座',
    source: '2022 年 6 月 · 卷 A',
    year: 2022,
    material: [
      { speaker: 'N', text: 'Economic models usually assume people compare all available options. Real shoppers compare two, then stop.' },
      { speaker: 'N', text: 'This is not laziness. Comparing everything is expensive, and the second option is usually good enough.' },
      { speaker: 'N', text: 'Markets, in other words, are full of people who stop looking early.' }
    ],
    stem: 'How does the speaker explain early stopping?',
    options: [
      'As a rational response to the cost of comparing.',
      'As a sign that consumers are careless.',
      'As a result of limited product variety.',
      'As an effect of advertising.'
    ],
    answer: 0,
    explain: '「This is not laziness. Comparing everything is expensive」——是权衡成本后的合理行为。',
    summary: '经济模型假设人比较所有选项，实际购物者比两个就停；这不是懒，而是比较成本高、第二个常已够用。'
  },
  {
    id: 'c6-m14',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2022 年 12 月 · 卷 B',
    year: 2022,
    material: [
      { speaker: 'M', text: 'The department wants all courses to include a group project.' },
      { speaker: 'W', text: 'For what purpose?' },
      { speaker: 'M', text: 'Employers ask for teamwork experience.' },
      { speaker: 'W', text: 'Employers ask for evidence of it. A group project where one student does everything is not evidence.' }
    ],
    stem: 'What is the woman\'s objection?',
    options: [
      'Group projects take too much class time.',
      'A group project does not prove every member contributed.',
      'Employers do not value teamwork.',
      'The department has too few teachers.'
    ],
    answer: 1,
    explain: '「A group project where one student does everything is not evidence」——一人包办的项目无法证明人人参与。',
    summary: '系里要求所有课程加小组项目，理由是雇主看重团队经验；女士反驳：一人全包的项目并不能作为证据。'
  },
  {
    id: 'c6-m15',
    level: 'cet6',
    mode: 'mock',
    section: '新闻',
    source: '2023 年 6 月 · 卷 A',
    year: 2023,
    material: [
      { speaker: 'N', text: 'A coastal city has begun raising the height of its sea wall in stages, using money set aside for road repairs.' },
      { speaker: 'N', text: 'Officials say the transfer was necessary because insurance costs for flooded districts had doubled.' },
      { speaker: 'N', text: 'Residents note that the roads being postponed are in the same districts.' }
    ],
    stem: 'Why did the city move road-repair money to the sea wall?',
    options: [
      'Flood insurance costs had doubled.',
      'The road work was finished early.',
      'The central government required it.',
      'Residents voted for the change.'
    ],
    answer: 0,
    explain: '「insurance costs for flooded districts had doubled」——受灾街区保费翻倍，只好挪用修路钱修海堤。',
    summary: '沿海城市分期加高海堤，动用修路经费，因为受淹街区保费翻倍；居民指出被推迟修的路正位于同一片街区。'
  },
  {
    id: 'c6-m16',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    source: '2023 年 12 月 · 卷 B',
    year: 2023,
    material: [
      { speaker: 'N', text: 'Most people believe they would notice if a photo were edited. Studies suggest they notice only when told to look for it.' },
      { speaker: 'N', text: 'In one test, half the participants were asked to check an image before judging its truth.' },
      { speaker: 'N', text: 'That half caught most of the edits; the other half saw a normal picture.' }
    ],
    stem: 'What made the difference in the experiment?',
    options: [
      'Being told in advance to check the image.',
      'Having more experience with photography.',
      'The quality of the edited image.',
      'The time available for judging.'
    ],
    answer: 0,
    explain: '「half the participants were asked to check an image before judging」——被明确要求先检查的人才发现了修图。',
    summary: '人们自信能看出修图，但研究发现只有被提示去检查的人才能发现；未被提示的一半看到的只是「正常照片」。'
  },
  {
    id: 'c6-m17',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2024 年 6 月 · 卷 A',
    year: 2024,
    material: [
      { speaker: 'W', text: 'The museum shop sells more books than the bookshop next door.' },
      { speaker: 'M', text: 'Because visitors are already in a buying mood?' },
      { speaker: 'W', text: 'Partly. But also because the books are placed where people wait.' },
      { speaker: 'M', text: 'So the shelf is doing the selling, not the title.' }
    ],
    stem: 'What is the main reason the museum shop sells more books?',
    options: [
      'Its books are cheaper than the bookshop\'s.',
      'Its books are placed where visitors wait.',
      'It has a larger selection of titles.',
      'Visitors are always in a buying mood.'
    ],
    answer: 1,
    explain: '「the books are placed where people wait」+「the shelf is doing the selling」——位置在卖书，而不是书名。',
    summary: '博物馆商店的书比隔壁书店卖得多：一是访客本就有购买情绪，二是书摆在人们等候的位置——是货架在卖书。'
  },
  {
    id: 'c6-m18',
    level: 'cet6',
    mode: 'mock',
    section: '讲座',
    source: '2024 年 12 月 · 卷 B',
    year: 2024,
    material: [
      { speaker: 'N', text: 'Language learners are often told to think in the new language as soon as possible.' },
      { speaker: 'N', text: 'But translation is a tool, not a failure. Beginners who translate reach meaning faster, and speed keeps them interested.' },
      { speaker: 'N', text: 'The goal is to need translation less, not to forbid it.' }
    ],
    stem: 'What is the speaker\'s view on translation?',
    options: [
      'It should be avoided from the first day.',
      'It is a useful tool that should be needed less over time.',
      'It slows learners down permanently.',
      'It only works for advanced learners.'
    ],
    answer: 1,
    explain: '「translation is a tool, not a failure ... The goal is to need translation less, not to forbid it」。',
    summary: '语言学习者常被要求尽快用新语言思考；讲者认为翻译是工具而非失败，目标是把依赖翻译的频率降下来，而不是禁止。'
  },
  {
    id: 'c6-m19',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2025 年 6 月 · 卷 A',
    year: 2025,
    material: [
      { speaker: 'M', text: 'Our team is moving to a four-day week for a six-month trial.' },
      { speaker: 'W', text: 'Same pay?' },
      { speaker: 'M', text: 'Same pay, same output expected. The week is shorter, not the work.' },
      { speaker: 'W', text: 'Then the trial is really about meetings, not hours.' }
    ],
    stem: 'What does the woman mean?',
    options: [
      'The trial will fail because output cannot stay the same.',
      'The trial\'s real test is cutting unproductive meeting time.',
      'Employees will be paid less during the trial.',
      'The team should work six days instead.'
    ],
    answer: 1,
    explain: '「the trial is really about meetings, not hours」——产出不变、时间变少，唯一能做文章的是减少无效会议。',
    summary: '团队试四天工作制，工资与产出不变；女士点出这试验实质是压缩会议，而不是压缩工时。'
  },
  {
    id: 'c6-m20',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    source: '2025 年 12 月 · 卷 B',
    year: 2025,
    material: [
      { speaker: 'N', text: 'Old buildings are often called inefficient because they leak heat. Replacing them is expensive, and the new building carries its own carbon cost.' },
      { speaker: 'N', text: 'A recent study found that insulating a 1970s block saved more energy per pound than demolishing it.' },
      { speaker: 'N', text: 'The greenest building, the authors note, is often the one already standing.' }
    ],
    stem: 'What did the study find?',
    options: [
      'Insulating old buildings saved more energy per unit of money than rebuilding.',
      'Old buildings should always be demolished.',
      'New buildings have no carbon cost.',
      'Insulation does not reduce energy use.'
    ],
    answer: 0,
    explain: '「insulating a 1970s block saved more energy per pound than demolishing it」。',
    summary: '老楼常因漏热被指低效，但拆旧建新既贵又有碳成本；研究显示给 70 年代楼加保温，每磅支出的节能效果优于拆除重建。'
  },
  {
    id: 'c6-m21',
    level: 'cet6',
    mode: 'mock',
    section: '新闻',
    source: '2026 年 6 月 · 卷 A',
    year: 2026,
    material: [
      { speaker: 'N', text: 'A regional government has made it compulsory for large employers to publish the gender pay gap in each job grade.' },
      { speaker: 'N', text: 'The first reports show gaps of under two per cent in most grades, but over fifteen per cent at senior levels.' },
      { speaker: 'N', text: 'Officials say the figures will be checked against hiring records.' }
    ],
    stem: 'What do the first reports show?',
    options: [
      'Pay gaps are small overall but large at senior levels.',
      'Pay gaps have disappeared in most grades.',
      'Senior staff are paid less than new employees.',
      'Companies refused to publish the figures.'
    ],
    answer: 0,
    explain: '「gaps of under two per cent in most grades, but over fifteen per cent at senior levels」。',
    summary: '某地区要求大雇主按职级公布性别薪酬差：多数职级不到 2%，但高层超过 15%，官方将用招聘记录核查。'
  },
  {
    id: 'c6-m22',
    level: 'cet6',
    mode: 'mock',
    section: '讲座',
    source: '2026 年 6 月 · 卷 B',
    year: 2026,
    material: [
      { speaker: 'N', text: 'We tend to think of attention as a spotlight. A better image may be a filter.' },
      { speaker: 'N', text: 'A spotlight chooses where to look. A filter decides what is allowed through at all.' },
      { speaker: 'N', text: 'Most attention training works on the filter: deciding in advance what to ignore.' }
    ],
    stem: 'Why does the speaker prefer the image of a filter?',
    options: [
      'Because attention decides what to ignore, not only where to look.',
      'Because filters are more modern than spotlights.',
      'Because attention cannot be trained.',
      'Because spotlights are too bright for research.'
    ],
    answer: 0,
    explain: '「A filter decides what is allowed through at all」+「deciding in advance what to ignore」——注意力更像预筛，而不只是指向。',
    summary: '注意力常被比作聚光灯，讲者认为更像滤网：灯决定看哪儿，滤网决定什么能进来；多数注意力训练练的是「预先决定忽略什么」。'
  },
  {
    id: 'c6-m23',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2026 年 12 月 · 卷 A',
    year: 2026,
    material: [
      { speaker: 'W', text: 'The alumni office wants to email every graduate twice a month.' },
      { speaker: 'M', text: 'How many unsubscribed last time?' },
      { speaker: 'W', text: 'Four per cent after one campaign.' },
      { speaker: 'M', text: 'Then twice a month will empty the list by spring. Email is a budget, not a channel.' }
    ],
    stem: 'What does the man mean by "email is a budget"?',
    options: [
      'Email campaigns cost money to send.',
      'Reader attention is limited and should be spent carefully.',
      'The office needs a larger mailing budget.',
      'Graduates should pay to receive emails.'
    ],
    answer: 1,
    explain: '「Email is a budget, not a channel」——把邮件当作有限额度：一次群发就退订 4%，发得越密名单越空。',
    summary: '校友办想每月群发两次邮件；上次一次活动退订 4%，男士比喻邮件是「预算」不是「渠道」，用得太密会把名单耗空。'
  },
  {
    id: 'c6-m24',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    source: '2026 年 12 月 · 卷 B',
    year: 2026,
    material: [
      { speaker: 'N', text: 'Team size has an effect that is easy to miss. Five people agree quickly; twelve people agree slowly but better.' },
      { speaker: 'N', text: 'The difference is not intelligence. It is the number of people who must be persuaded.' },
      { speaker: 'N', text: 'So small teams are faster, and larger teams are usually more accurate.' }
    ],
    stem: 'What accounts for the difference between small and large teams?',
    options: [
      'The intelligence of the team members.',
      'How many people must be persuaded.',
      'The amount of time available.',
      'The quality of the leader.'
    ],
    answer: 1,
    explain: '「The difference is not intelligence. It is the number of people who must be persuaded.」',
    summary: '五人团队达成一致快、十二人慢但更准，差别不在智力，而在于需要说服的人有多少。'
  },
  {
    id: 'c6-m25',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    source: '2026 年 12 月 · 卷 C',
    year: 2026,
    material: [
      { speaker: 'M', text: 'The publisher wants the audio edition out the same day as the print book.' },
      { speaker: 'W', text: 'Is that possible with the narrator we want?' },
      { speaker: 'M', text: 'She is booked until March. We could use a different narrator for the first chapters.' },
      { speaker: 'W', text: 'Listeners will notice the change mid-book. Better to delay than to switch voices.' }
    ],
    stem: 'What does the woman recommend?',
    options: [
      'Using a different narrator for early chapters.',
      'Delaying the audio edition to keep one narrator.',
      'Publishing the print book later.',
      'Cancelling the audio edition entirely.'
    ],
    answer: 1,
    explain: '「Better to delay than to switch voices」——宁可延后，也别中途换朗读者。',
    summary: '出版社想让有声书与纸书同日上市，但心仪的朗读员三月才有空；女士建议宁可延后，也不要中途换人。'
  },
  {
    id: 'c6-m26',
    level: 'cet6',
    mode: 'mock',
    section: '讲座',
    source: '2026 年 12 月 · 卷 D',
    year: 2026,
    material: [
      { speaker: 'N', text: 'Cities plant trees for shade, then prune them for safety, then wonder why the shade is gone.' },
      { speaker: 'N', text: 'The two goals are not equal. A tree that never grows large gives little shade but few branches fall.' },
      { speaker: 'N', text: 'Deciding which risk to accept is a political question, not a technical one.' }
    ],
    stem: 'What is the speaker\'s main point?',
    options: [
      'Pruning is always unnecessary.',
      'Choosing between shade and safety is a political decision.',
      'Trees should never be planted in cities.',
      'Falling branches are not a real risk.'
    ],
    answer: 1,
    explain: '「Deciding which risk to accept is a political question, not a technical one」——在两个目标之间取舍属于政治判断。',
    summary: '城市为遮阴种树、又为安全修剪，结果遮阴没了；两个目标本来冲突，接受哪种风险是政治选择而非技术问题。'
  }
]
