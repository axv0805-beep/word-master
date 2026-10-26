import type { ListeningItem } from '../../core/listening'

/**
 * 六级听力 · 专项训练题库。
 * 六级材料更长、更偏学术与抽象：讲座片段、研究报告、政策讨论、科技新闻，
 * 设问多为推断、态度、因果，选项长度也更接近六级真题。
 */

export const CET6_DRILL: ListeningItem[] = [
  {
    id: 'c6-d01',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'Your paper argues that remote work reduces creativity. Is not that a little strong?' },
      { speaker: 'M', text: 'I would say it is conditional. Remote work is fine for routine tasks, but chance meetings are where new ideas usually start.' },
      { speaker: 'W', text: 'So your problem is not the technology but the loss of unplanned contact?' },
      { speaker: 'M', text: 'Exactly. Put people in a building and they argue about coffee. Take them apart and nobody argues at all.' }
    ],
    stem: 'What is the man\'s main point about remote work?',
    options: [
      'It damages creativity mainly by removing unplanned contact.',
      'It is unsuitable for routine office tasks.',
      'It makes employees argue too much with each other.',
      'It should be banned for most companies.'
    ],
    answer: 0,
    explain: '他强调远程对常规工作没问题，问题在「loss of unplanned contact」（缺少偶然交流），这才是影响创造力的原因。',
    summary: '男士论文认为远程办公伤创造力，但强调是有条件的：常规工作没事，缺少偶然碰面才让新想法变少。'
  },
  {
    id: 'c6-d02',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'The department wants to cut the number of tutorials next year to save money.' },
      { speaker: 'W', text: 'And replace them with what? Larger lectures?' },
      { speaker: 'M', text: 'That is the plan. Students would meet a tutor once a month instead of once a week.' },
      { speaker: 'W', text: 'The saving is small compared with the damage. Most students come here for the small groups.' }
    ],
    stem: 'Why does the woman oppose the plan?',
    options: [
      'The savings are small compared with the harm it does.',
      'She thinks larger lectures are too expensive.',
      'She wants tutorials to be held every month.',
      'She believes tutors are poorly paid.'
    ],
    answer: 0,
    explain: '「The saving is small compared with the damage」——省的钱不多，损害却不小，这是她反对的理由。',
    summary: '系里想减少小班辅导省钱，女士反对：省得少、伤得大，学生正是冲着小班来的。'
  },
  {
    id: 'c6-d03',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'For years, city planners treated trees as decoration. Recent measurements suggest they behave more like equipment.' },
      { speaker: 'N', text: 'A mature street tree can lower the temperature of the air around it by two degrees, which matters during heat waves.' },
      { speaker: 'N', text: 'It also holds rainwater, reducing the load on drains during storms.' }
    ],
    stem: 'How does the speaker describe city trees?',
    options: [
      'As decoration that costs too much to maintain.',
      'As functional equipment for cooling and drainage.',
      'As a danger during heavy storms.',
      'As a replacement for air conditioning.'
    ],
    answer: 1,
    explain: '「they behave more like equipment」，后面列举降温两度、蓄留雨水减轻排水压力，强调功能性。',
    summary: '规划者过去把行道树当装饰，新测量发现它能降温两度、蓄雨水减轻排水负担，更像基础设施。'
  },
  {
    id: 'c6-d04',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'You looked at the survey data for the cycling scheme. Did it change your mind?' },
      { speaker: 'M', text: 'Partly. Support is high, but only among people who already cycle. Drivers have not changed at all.' },
      { speaker: 'W', text: 'So the scheme mainly serves existing cyclists?' },
      { speaker: 'M', text: 'For now, yes. The lanes are on quiet streets. Nobody switches if the route to work is still dangerous.' }
    ],
    stem: 'What limitation does the man point out?',
    options: [
      'The scheme is too expensive to continue.',
      'The lanes do not serve routes people actually need.',
      'Drivers strongly oppose the scheme.',
      'The survey data were collected incorrectly.'
    ],
    answer: 1,
    explain: '「The lanes are on quiet streets ... the route to work is still dangerous」——自行车道修在清静街上，通勤路线仍危险，所以吸引不到开车的人。',
    summary: '调查显示支持者多是已有骑行者，车道设在清静街道，通勤路线不安全，因此没能让开车族改骑车。'
  },
  {
    id: 'c6-d05',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'A common mistake in scientific writing is to describe a result as "significant" without saying significant to whom.' },
      { speaker: 'N', text: 'In statistics, significant merely means unlikely to be produced by chance; it says nothing about size or importance.' },
      { speaker: 'N', text: 'Readers therefore need the actual numbers, not the label.' }
    ],
    stem: 'What does the speaker say about the word "significant"?',
    options: [
      'It is the clearest way to report a result.',
      'It only means the result is unlikely to be due to chance.',
      'It always refers to the importance of a finding.',
      'It should be replaced by the word "large".'
    ],
    answer: 1,
    explain: '「significant merely means unlikely to be produced by chance; it says nothing about size or importance」。',
    summary: '科学写作常滥用 significant：统计上它只表示「不太可能是巧合」，与大小、重要性无关，读者更需要具体数字。'
  },
  {
    id: 'c6-d06',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'The company wants to move the whole support team to a new system next month.' },
      { speaker: 'W', text: 'Next month? We have not finished testing.' },
      { speaker: 'M', text: 'They say the old system costs too much to keep running.' },
      { speaker: 'W', text: 'A week of mistakes will cost far more than a month of the old system.' }
    ],
    stem: 'What is the woman\'s attitude towards the move?',
    options: [
      'She supports it because it saves money.',
      'She thinks the timetable is too rushed.',
      'She wants to hire more support staff.',
      'She thinks the new system should be cancelled.'
    ],
    answer: 1,
    explain: '她强调测试没做完，并说一周出错的花费比再用一个月旧系统更高，是嫌时间太赶。',
    summary: '公司想下月就换客服系统，女士反对：测试没完，一周出错远贵于再用一个月旧系统。'
  },
  {
    id: 'c6-d07',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'Museums are increasingly hiring writers, not to advertise exhibitions, but to argue with the collections.' },
      { speaker: 'N', text: 'A label that says "this object was probably used in trade" invites a question; a label that says "rare vase" invites silence.' },
      { speaker: 'N', text: 'The experiment is to make visitors doubt the display, and therefore look longer.' }
    ],
    stem: 'Why do museums hire writers to write labels?',
    options: [
      'To make exhibitions easier to advertise.',
      'To encourage visitors to question what they see.',
      'To replace the work of curators entirely.',
      'To make labels shorter and simpler.'
    ],
    answer: 1,
    explain: '「make visitors doubt the display, and therefore look longer」——让观众对展品产生疑问，从而看得更久。',
    summary: '博物馆请作家写说明牌，用「大概用于贸易」这类说法引发疑问，让观众怀疑并停留更久。'
  },
  {
    id: 'c6-d08',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'The report says our air quality improved, but the monitoring station moved to a park.' },
      { speaker: 'M', text: 'So the numbers may reflect the new location rather than cleaner air?' },
      { speaker: 'W', text: 'That is exactly the problem. A park has less traffic than the old site beside the road.' },
      { speaker: 'M', text: 'Then the improvement cannot be separated from the move.' }
    ],
    stem: 'What is the speakers\' concern about the report?',
    options: [
      'The park is too far from the city centre.',
      'The data may be affected by the station\'s new location.',
      'The monitoring equipment is too old.',
      'The report was published too late.'
    ],
    answer: 1,
    explain: '监测站搬到公园，而公园车少，所以「improvement cannot be separated from the move」——改善与地点变化分不清。',
    summary: '报告显示空气质量改善，但监测站搬到了车流更少的公园，数据改善可能来自位置变化而非空气。'
  },
  {
    id: 'c6-d09',
    level: 'cet6',
    mode: 'drill',
    section: '新闻',
    material: [
      { speaker: 'N', text: 'A European court has ruled that companies must tell job applicants when artificial intelligence is used to screen their applications.' },
      { speaker: 'N', text: 'The ruling follows a case brought by a software engineer rejected by an automated system.' },
      { speaker: 'N', text: 'Companies may still use such tools, but must allow candidates to request a human review.' }
    ],
    stem: 'What does the court ruling require companies to do?',
    options: [
      'Stop using artificial intelligence in hiring.',
      'Disclose AI screening and allow human review on request.',
      'Publish all rejected applications.',
      'Hire the engineer who brought the case.'
    ],
    answer: 1,
    explain: '「must tell job applicants when artificial intelligence is used」+「must allow candidates to request a human review」——要告知并允许申请人工复核。',
    summary: '欧洲法院裁定：用 AI 筛简历必须告知申请人，并允许申请人工复核。'
  },
  {
    id: 'c6-d10',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'Sleep researchers used to study the brain at night. Now many study the gut, because digestion slows and shifts during sleep.' },
      { speaker: 'N', text: 'People who eat late at night report more heartburn, but also, surprisingly, more vivid dreams.' },
      { speaker: 'N', text: 'The link is not yet explained, and the researchers warn against drawing conclusions too quickly.' }
    ],
    stem: 'What do the researchers warn against?',
    options: [
      'Eating late at night in general.',
      'Drawing conclusions before the link is explained.',
      'Studying digestion instead of the brain.',
      'Recording dreams in a laboratory.'
    ],
    answer: 1,
    explain: '「warn against drawing conclusions too quickly」，因为「The link is not yet explained」。',
    summary: '睡眠研究开始关注肠道：夜间进食者更易烧心、做梦也更生动，但机制未明，研究者提醒别急着下结论。'
  },
  {
    id: 'c6-d11',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'The city wants to close the market for two years to rebuild it.' },
      { speaker: 'W', text: 'Where do the traders go during that time?' },
      { speaker: 'M', text: 'The plan offers space in a car park on the edge of town.' },
      { speaker: 'W', text: 'Traders will not follow customers that far. Rebuild one side first, keep the other open.' }
    ],
    stem: 'What alternative does the woman propose?',
    options: [
      'Rebuild in stages while keeping part of the market open.',
      'Move the whole market to the car park permanently.',
      'Close the market for only six months.',
      'Build a new market in the town centre.'
    ],
    answer: 0,
    explain: '「Rebuild one side first, keep the other open」——分期改造，另一侧照常营业。',
    summary: '市政府要关市场两年重建，商贩会被迁到城边停车场；女士建议分期改造、保留一半营业。'
  },
  {
    id: 'c6-d12',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'The idea that young people are naturally good with technology is repeated so often that it has become a policy assumption.' },
      { speaker: 'N', text: 'Yet surveys show wide differences in how well students use software they have never seen before.' },
      { speaker: 'N', text: 'Familiarity with phones does not automatically transfer to spreadsheets or citation tools.' }
    ],
    stem: 'What does the speaker challenge?',
    options: [
      'The claim that young people are naturally skilled with all technology.',
      'The value of teaching spreadsheets at school.',
      'The reliability of surveys about students.',
      'The idea that phones are useful for learning.'
    ],
    answer: 0,
    explain: '「The idea ... is repeated so often that it has become a policy assumption. Yet surveys show wide differences」——质疑「年轻人天生擅长技术」这一成见。',
    summary: '「年轻人天生懂技术」被当成政策前提，但调查显示差异很大：会用手机不等于会用电子表格和文献工具。'
  },
  {
    id: 'c6-d13',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'The museum wants to return some objects to the country they came from.' },
      { speaker: 'M', text: 'Is that a legal decision or a moral one?' },
      { speaker: 'W', text: 'Both, and the two do not always agree. Some were bought legally at the time, by rules we would not accept today.' },
      { speaker: 'M', text: 'So the question is whether old legality is enough to justify keeping them.' }
    ],
    stem: 'What question does the man summarise?',
    options: [
      'Whether the objects are valuable enough to keep.',
      'Whether past legality is enough to justify keeping the objects.',
      'Whether the museum should close part of its collection.',
      'Whether the public will notice the missing objects.'
    ],
    answer: 1,
    explain: '「whether old legality is enough to justify keeping them」——过去的合法是否足以支撑继续保存。',
    summary: '博物馆讨论归还文物：当年按那时规则合法购入，但今天不接受，争点在于「旧时的合法能否成为保留的理由」。'
  },
  {
    id: 'c6-d14',
    level: 'cet6',
    mode: 'drill',
    section: '新闻',
    material: [
      { speaker: 'N', text: 'A study of two thousand office buildings found that those with openable windows had fewer complaints about tiredness in the afternoon.' },
      { speaker: 'N', text: 'The authors caution that the sample was self-selected: buildings that allow windows may already be better managed.' },
      { speaker: 'N', text: 'They call for a controlled trial before any change to building rules.' }
    ],
    stem: 'Why do the authors call for a controlled trial?',
    options: [
      'Because the buildings in the study were chosen by their managers.',
      'Because openable windows are illegal in many cities.',
      'Because the sample of workers was too small.',
      'Because tiredness cannot be measured reliably.'
    ],
    answer: 0,
    explain: '「the sample was self-selected: buildings that allow windows may already be better managed」——样本自选，可能本身管理更好，所以要对照试验。',
    summary: '两千栋办公楼调查显示可开窗者下午更少抱怨疲劳，但样本自选、可能有偏差，作者呼吁做对照试验再改建筑规范。'
  },
  {
    id: 'c6-d15',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'Reading aloud to children is often praised for improving vocabulary, but its larger effect may be on attention.' },
      { speaker: 'N', text: 'A child who follows a story for ten minutes practises ignoring distractions, a skill that matters in every subject.' },
      { speaker: 'N', text: 'The vocabulary gain is real; the attention gain is the surprise.' }
    ],
    stem: 'What is the surprise finding in the passage?',
    options: [
      'Reading aloud improves attention more than expected.',
      'Vocabulary gains are larger than attention gains.',
      'Children dislike being read to after age eight.',
      'Attention cannot be improved by reading.'
    ],
    answer: 0,
    explain: '「The vocabulary gain is real; the attention gain is the surprise」——注意力提升才是意外发现。',
    summary: '给孩子朗读常被夸提升词汇，但更大作用可能在专注力：跟着故事十分钟就是练抗干扰。'
  },
  {
    id: 'c6-d16',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'The startup wants me to join on a lower salary but with shares.' },
      { speaker: 'W', text: 'Do you understand how those shares are valued?' },
      { speaker: 'M', text: 'They told me the company is worth ten million.' },
      { speaker: 'W', text: 'That is what they hope. Ask for the last investor document, not the number in the meeting.' }
    ],
    stem: 'What does the woman advise the man to do?',
    options: [
      'Ask for the last investor document.',
      'Refuse the offer completely.',
      'Negotiate a higher salary instead of shares.',
      'Wait until the company is sold.'
    ],
    answer: 0,
    explain: '「Ask for the last investor document, not the number in the meeting」——要投资人文件，而不是会议上的口头估值。',
    summary: '创业公司给低薪加股权，男士说公司估值一千万；女士提醒要投资人文件核实，别信口头数字。'
  },
  {
    id: 'c6-d17',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'Cities often measure success by the number of trees planted. Ecologists prefer survival rates three years later.' },
      { speaker: 'N', text: 'In one programme, ninety per cent were planted and forty per cent survived, because nobody planned who would water them.' },
      { speaker: 'N', text: 'The lesson is administrative, not botanical.' }
    ],
    stem: 'What does the speaker mean by "the lesson is administrative, not botanical"?',
    options: [
      'The problem was organisation, not plant science.',
      'The trees were the wrong species.',
      'Cities should plant fewer trees.',
      'Ecologists misunderstand how trees grow.'
    ],
    answer: 0,
    explain: '「nobody planned who would water them」说明失败在组织管理（谁浇水），不是植物学问题。',
    summary: '城市以种树数量论功，生态学者更看三年存活率；某项目种九成、活四成，原因是没人负责浇水——教训在管理而非植物学。'
  },
  {
    id: 'c6-d18',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'The university plans to record lectures and put them online for everyone.' },
      { speaker: 'M', text: 'Will attendance fall?' },
      { speaker: 'W', text: 'The pilot suggests not. Students still come, but they use the recordings before exams.' },
      { speaker: 'M', text: 'Then the risk is not absence, it is that we teach differently once we know we are recorded.' }
    ],
    stem: 'What risk does the man identify?',
    options: [
      'Students will stop attending classes.',
      'Teachers may change how they teach because of recording.',
      'Recordings will be too large to store.',
      'Exams will become easier to pass.'
    ],
    answer: 1,
    explain: '「it is that we teach differently once we know we are recorded」——真正的风险是知道被录之后老师改变教法。',
    summary: '大学要把课录下来公开，试点显示出勤没降、学生考前看回放；男士担心老师会因被录制而改变教法。'
  },
  {
    id: 'c6-d19',
    level: 'cet6',
    mode: 'drill',
    section: '新闻',
    material: [
      { speaker: 'N', text: 'A shipping company has agreed to slow its vessels by ten per cent on long routes, a move it says will cut fuel use by nearly a fifth.' },
      { speaker: 'N', text: 'Customers accept longer delivery times for a lower carbon charge.' },
      { speaker: 'N', text: 'Environmental groups welcome the move but note that total shipping is still growing.' }
    ],
    stem: 'How do environmental groups respond?',
    options: [
      'They reject the plan as ineffective.',
      'They welcome it but note that shipping overall keeps growing.',
      'They ask the company to slow down further.',
      'They demand lower prices for customers.'
    ],
    answer: 1,
    explain: '「welcome the move but note that total shipping is still growing」——欢迎但指出总运量仍在增长。',
    summary: '航运公司长途减速一成、省油近两成，客户接受更长时效换低碳；环保组织欢迎但提醒总运量仍在涨。'
  },
  {
    id: 'c6-d20',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'When a city adds a new subway line, property near the stations usually rises in value. The gain is often captured first by owners who did nothing.' },
      { speaker: 'N', text: 'Some cities now tax part of that gain to pay for the line itself.' },
      { speaker: 'N', text: 'The argument is simple: if public money creates the value, some of it should return.' }
    ],
    stem: 'What is the argument for taxing part of the property gain?',
    options: [
      'Owners should not be allowed to sell their property.',
      'Public investment created the value, so part should return.',
      'Rising property prices are always harmful.',
      'Subway lines are too expensive to build.'
    ],
    answer: 1,
    explain: '「if public money creates the value, some of it should return」——公共投资带来增值，理应返还一部分。',
    summary: '新地铁线周边房价上涨，收益常被原地主独得；有城市对这部分增值征税来补贴修线，理由是公共投资带来的价值应部分回归。'
  },
  {
    id: 'c6-d21',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'I am thinking of doing a PhD, but everyone warns me about the job market.' },
      { speaker: 'W', text: 'What would you do with it if the academic jobs disappeared?' },
      { speaker: 'M', text: 'I would like to work in policy, maybe in public health.' },
      { speaker: 'W', text: 'Then do it, but choose a topic that policy people can use. That is your real insurance.' }
    ],
    stem: 'What is the woman\'s advice?',
    options: [
      'Give up the PhD because the market is bad.',
      'Choose a topic that is useful outside academia.',
      'Only apply for academic positions.',
      'Study public health instead of policy.'
    ],
    answer: 1,
    explain: '「choose a topic that policy people can use. That is your real insurance」——选一个政策界用得上的题目，这才是保险。',
    summary: '男生想读博但担心就业，女士问他没学术岗打算做什么，得知想做政策后建议选政策界用得上的题目。'
  },
  {
    id: 'c6-d22',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'Translations are often judged by how little they seem like translations. This standard hides something important.' },
      { speaker: 'N', text: 'A text that reads smoothly may have quietly removed what was strange in the original.' },
      { speaker: 'N', text: 'Some translators now defend awkwardness when it belongs to the author.' }
    ],
    stem: 'What are some translators defending?',
    options: [
      'Smoother, easier-to-read translations.',
      'Keeping the original author\'s awkwardness.',
      'Removing words that readers find strange.',
      'Refusing to translate difficult texts.'
    ],
    answer: 1,
    explain: '「Some translators now defend awkwardness when it belongs to the author」——主张保留属于原作者的那种「不顺畅」。',
    summary: '译文常被要求读起来不像译文，但这标准可能抹平原作的陌生感；有译者主张保留属于作者本人的拗口。'
  },
  {
    id: 'c6-d23',
    level: 'cet6',
    mode: 'drill',
    section: '新闻',
    material: [
      { speaker: 'N', text: 'A university has replaced its printed course handbook with a searchable website.' },
      { speaker: 'N', text: 'Students now find course rules in seconds, but fewer read the sections they were not looking for.' },
      { speaker: 'N', text: 'The university is adding short quizzes on key rules to its welcome week.' }
    ],
    stem: 'What unintended effect did the change have?',
    options: [
      'Students read fewer of the rules they were not searching for.',
      'The website was too slow to use.',
      'Printed handbooks were still more popular.',
      'Rules became harder to find.'
    ],
    answer: 0,
    explain: '「fewer read the sections they were not looking for」——只看要查的，不再顺带读到别的规定。',
    summary: '课程手册改成可搜索网站，学生查规定更快，但不再顺带读到其他规定；学校在迎新周加了小测验。'
  },
  {
    id: 'c6-d24',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'The phrase "digital native" suggests a generation that needs no training. Employers report the opposite.' },
      { speaker: 'N', text: 'Young workers are fast with apps but often slow with file systems, backups and version control.' },
      { speaker: 'N', text: 'Skill with a screen is not the same as understanding how information is stored.' }
    ],
    stem: 'What do employers report?',
    options: [
      'Young workers need no digital training.',
      'Young workers are quick with apps but weak on file systems.',
      'Older workers learn new software faster.',
      'Digital skills are no longer important.'
    ],
    answer: 1,
    explain: '「fast with apps but often slow with file systems, backups and version control」——应用上手快，文件系统、备份、版本管理弱。',
    summary: '「数字原住民」暗示这一代无需培训，但雇主发现年轻人应用上手快、文件系统与备份管理弱。'
  },
  {
    id: 'c6-d25',
    level: 'cet6',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'Our survey had a response rate of six per cent. Can we still publish?' },
      { speaker: 'M', text: 'You can, if you report the rate honestly and describe who replied.' },
      { speaker: 'W', text: 'The people who replied were mostly already interested in the topic.' },
      { speaker: 'M', text: 'Then say so. The finding describes the interested, not the public.' }
    ],
    stem: 'What does the man require the woman to do?',
    options: [
      'Collect more responses before publishing.',
      'Report the low response rate and describe the respondents.',
      'Change the topic of the survey.',
      'Publish without mentioning the method.'
    ],
    answer: 1,
    explain: '「report the rate honestly and describe who replied」——如实报告回收率并说明回答者是谁。',
    summary: '问卷回收率仅 6%，男生说可以发，但要如实说明回收率与样本构成：结论只代表「感兴趣的人」。'
  },
  {
    id: 'c6-d26',
    level: 'cet6',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'Jazz musicians describe learning to improvise as first memorising many phrases, then forgetting them at the right moment.' },
      { speaker: 'N', text: 'The phrases are not the goal; they are the material from which choice becomes possible.' },
      { speaker: 'N', text: 'Beginners who try to invent without material usually repeat the same two ideas.' }
    ],
    stem: 'What is the speaker\'s point about improvisation?',
    options: [
      'It requires a large store of learned material first.',
      'It is impossible to teach to beginners.',
      'It is mainly about repeating familiar phrases.',
      'It is easier than memorising music.'
    ],
    answer: 0,
    explain: '「first memorising many phrases, then forgetting them」+「they are the material from which choice becomes possible」——先积累素材，才谈得上即兴选择。',
    summary: '爵士乐手说即兴要先背熟大量乐句、再在恰当时候放下；没有素材的新手只会重复两三个想法。'
  }
]
