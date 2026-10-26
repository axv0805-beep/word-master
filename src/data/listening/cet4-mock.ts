import type { ListeningItem } from '../../core/listening'

/**
 * 四级听力 · 真题模拟。
 * 材料按 2016–2026 年四六级真题的题型、场景与设问方式重写（新闻 / 长对话 / 短文），
 * source 里标出对应年份与场次，方便按年轮着练；音频同样由系统语音合成朗读。
 */

export const CET4_MOCK: ListeningItem[] = [
  {
    id: 'c4-m01',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2016 年 6 月 · 卷 A',
    year: 2016,
    material: [
      { speaker: 'W', text: 'You look tired. Did you stay up for the football match last night?' },
      { speaker: 'M', text: 'I did, and it went to extra time. But I would do it again; we won in the last minute.' },
      { speaker: 'W', text: 'You are lucky. I missed the whole thing because my phone was charging in the kitchen.' },
      { speaker: 'M', text: 'Do not worry. The full match will be online tonight, and I can send you the link.' }
    ],
    stem: 'Why does the man look tired?',
    options: [
      'He worked late on a report.',
      'He watched a long football match.',
      'He travelled overnight by train.',
      'He was waiting for a phone call.'
    ],
    answer: 1,
    explain: '男士说「stay up for the football match」还打到加时，所以看球导致疲惫。',
    summary: '男士熬夜看球赛，比赛进加时后主队最后一分钟获胜；女士错过了，他答应发回放链接。'
  },
  {
    id: 'c4-m02',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2016 年 12 月 · 卷 A',
    year: 2016,
    material: [
      { speaker: 'M', text: 'I would like to open a bank account. What do I need to bring?' },
      { speaker: 'W', text: 'Your ID card and a phone number we can reach you on. A student card gives you a free account.' },
      { speaker: 'M', text: 'How long does it take?' },
      { speaker: 'W', text: 'About fifteen minutes. The card will be posted to you within a week.' }
    ],
    stem: 'What does the woman say about the student card?',
    options: [
      'It can be used as an ID card.',
      'It makes the account free of charge.',
      'It is needed to post the bank card.',
      'It shortens the waiting time.'
    ],
    answer: 1,
    explain: '「A student card gives you a free account」——学生证可以免账户费用。',
    summary: '男生开账户需带身份证和手机号，学生证可享免费账户，办理约十五分钟，卡一周内寄到。'
  },
  {
    id: 'c4-m03',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2017 年 6 月 · 卷 A',
    year: 2017,
    material: [
      { speaker: 'N', text: 'In many cities, food waste from restaurants is now collected separately and turned into fertilizer.' },
      { speaker: 'N', text: 'The programme began as a two-year trial with fifty restaurants and has grown to more than six hundred.' },
      { speaker: 'N', text: 'Restaurants say the sorting takes a little extra work, but their rubbish bills have fallen by a third.' }
    ],
    stem: 'What benefit do restaurants report?',
    options: [
      'They save money on rubbish collection.',
      'They receive free fertilizer.',
      'They attract more customers.',
      'They hire fewer kitchen workers.'
    ],
    answer: 0,
    explain: '「their rubbish bills have fallen by a third」——垃圾处理费降了三分之一，是省钱。',
    summary: '餐馆厨余单独回收做肥料，试点从 50 家扩到 600 多家，商家虽多花点力气但垃圾费省三分之一。'
  },
  {
    id: 'c4-m04',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2017 年 12 月 · 卷 B',
    year: 2017,
    material: [
      { speaker: 'W', text: 'Did you manage to book the train tickets for the holiday?' },
      { speaker: 'M', text: 'Only the morning ones. The afternoon trains were sold out within an hour.' },
      { speaker: 'W', text: 'Morning is not bad. We can have lunch near the station before we go to the hotel.' },
      { speaker: 'M', text: 'Then I will book a table. That place near the station gets busy on holidays.' }
    ],
    stem: 'What will the man probably do next?',
    options: [
      'Book a restaurant table.',
      'Change the train tickets.',
      'Look for another hotel.',
      'Take an afternoon train.'
    ],
    answer: 0,
    explain: '他说「I will book a table」，因为车站附近那家店假期人多，所以下一步是订位。',
    summary: '只订到上午的车票，两人打算在车站附近吃午饭，男士去订餐厅。'
  },
  {
    id: 'c4-m05',
    level: 'cet4',
    mode: 'mock',
    section: '新闻',
    source: '2018 年 6 月 · 卷 A',
    year: 2018,
    material: [
      { speaker: 'N', text: 'A city in the north has made all its public buses free on weekends in an effort to cut traffic.' },
      { speaker: 'N', text: 'The transport office says bus use rose by eighteen per cent in the first month.' },
      { speaker: 'N', text: 'The measure will be reviewed after one year.' }
    ],
    stem: 'Why did the city make buses free on weekends?',
    options: [
      'To reduce traffic in the city.',
      'To help students travel to school.',
      'Because ticket machines broke down.',
      'To test a new bus route.'
    ],
    answer: 0,
    explain: '「in an effort to cut traffic」——目的是缓解交通拥堵。',
    summary: '北方某市周末公交免费以缓解拥堵，首月客流涨 18%，一年后评估。'
  },
  {
    id: 'c4-m06',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2018 年 12 月 · 卷 B',
    year: 2018,
    material: [
      { speaker: 'N', text: 'Volunteers in a coastal town count seabirds every October. The count began thirty years ago with four people.' },
      { speaker: 'N', text: 'Last year more than two hundred people took part, including many schoolchildren.' },
      { speaker: 'N', text: 'The data help scientists see which species are returning to the area.' }
    ],
    stem: 'What is the purpose of counting the birds?',
    options: [
      'To decide where to build new houses.',
      'To find out which species are returning.',
      'To train schoolchildren as guides.',
      'To attract tourists in October.'
    ],
    answer: 1,
    explain: '「The data help scientists see which species are returning to the area」——数据用于观察鸟类回归情况。',
    summary: '海边小镇三十年坚持十月数海鸟，人数从 4 人增至 200 多人，数据供科学家观察物种回归。'
  },
  {
    id: 'c4-m07',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2019 年 6 月 · 卷 A',
    year: 2019,
    material: [
      { speaker: 'M', text: 'Professor Li, I am worried about the group presentation next week.' },
      { speaker: 'W', text: 'Which part worries you most?' },
      { speaker: 'M', text: 'Speaking in front of the class. I am fine when I write, but my mind goes blank when I stand up.' },
      { speaker: 'W', text: 'Then do the introduction. It is short and you can read from notes. I will not take marks off for that.' }
    ],
    stem: 'What does the professor suggest the student do?',
    options: [
      'Write the whole presentation for the group.',
      'Take the short introduction part with notes.',
      'Practise in front of the class first.',
      'Present together with another student.'
    ],
    answer: 1,
    explain: '教授让他负责简短的引言部分，并且允许照着笔记读、不扣分。',
    summary: '学生怕上台讲话，教授让他做短引言并允许看笔记，不扣分。'
  },
  {
    id: 'c4-m08',
    level: 'cet4',
    mode: 'mock',
    section: '新闻',
    source: '2019 年 12 月 · 卷 A',
    year: 2019,
    material: [
      { speaker: 'N', text: 'An old railway line near the river will reopen as a walking path next spring.' },
      { speaker: 'N', text: 'The path is six kilometres long and connects three parks.' },
      { speaker: 'N', text: 'Cyclists are welcome, but they must keep their speed below fifteen kilometres an hour.' }
    ],
    stem: 'What rule do cyclists have to follow?',
    options: [
      'They may not use the path at all.',
      'They must ride slower than fifteen kilometres an hour.',
      'They must pay an entrance fee.',
      'They can only ride in the morning.'
    ],
    answer: 1,
    explain: '「they must keep their speed below fifteen kilometres an hour」——骑行者限速每小时十五公里以下。',
    summary: '河边旧铁路将改造成六公里步道串联三个公园，允许骑行但限速 15 公里。'
  },
  {
    id: 'c4-m09',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2020 年 7 月 · 卷 A',
    year: 2020,
    material: [
      { speaker: 'N', text: 'Working from home saves the average commuter about forty minutes a day.' },
      { speaker: 'N', text: 'A survey of two thousand office workers found that most of them use the extra time for exercise or cooking.' },
      { speaker: 'N', text: 'However, nearly half said they find it harder to stop working in the evening.' }
    ],
    stem: 'What problem do many home workers report?',
    options: [
      'They cook less often than before.',
      'They find it hard to stop working at night.',
      'They miss their morning exercise.',
      'They spend more time commuting.'
    ],
    answer: 1,
    explain: '「nearly half said they find it harder to stop working in the evening」——近一半人说晚上更难停下来。',
    summary: '居家办公每天省下四十分钟通勤，多数人拿去运动做饭，但近半数更难按时收工。'
  },
  {
    id: 'c4-m10',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2020 年 9 月 · 卷 B',
    year: 2020,
    material: [
      { speaker: 'W', text: 'The lab printer is not working again, and my report is due at five.' },
      { speaker: 'M', text: 'Have you tried the one on the second floor? It is slower but it always works.' },
      { speaker: 'W', text: 'I did not know there was one there.' },
      { speaker: 'M', text: 'It is behind the photocopier. You need your card to start it.' }
    ],
    stem: 'Where is the working printer located?',
    options: [
      'Next to the lab entrance.',
      'On the second floor behind the photocopier.',
      'In the professor\'s office.',
      'At the front desk of the library.'
    ],
    answer: 1,
    explain: '男士说「the one on the second floor」且「It is behind the photocopier」。',
    summary: '实验室打印机坏了，男士告诉她二楼复印机后面还有一台，要刷卡才能用。'
  },
  {
    id: 'c4-m11',
    level: 'cet4',
    mode: 'mock',
    section: '新闻',
    source: '2020 年 12 月 · 卷 A',
    year: 2020,
    material: [
      { speaker: 'N', text: 'Local farmers have started selling vegetables directly to city families through a weekly order system.' },
      { speaker: 'N', text: 'Families pay on Monday and collect their boxes on Saturday morning.' },
      { speaker: 'N', text: 'Farmers say the system gives them stable prices and less waste.' }
    ],
    stem: 'How does the weekly order system help farmers?',
    options: [
      'It brings stable prices and less waste.',
      'It lets them sell vegetables at weekends only.',
      'It pays them before they plant.',
      'It reduces the number of families they serve.'
    ],
    answer: 0,
    explain: '「the system gives them stable prices and less waste」——价格稳定、浪费更少。',
    summary: '农户通过每周订菜直接卖菜给市民，周一下单周六取货，价格稳定、损耗减少。'
  },
  {
    id: 'c4-m12',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2021 年 6 月 · 卷 A',
    year: 2021,
    material: [
      { speaker: 'N', text: 'The number of people learning a second language on their phone has doubled in five years.' },
      { speaker: 'N', text: 'Short lessons of five minutes are the most popular, especially on the way to work.' },
      { speaker: 'N', text: 'Teachers warn that short lessons work best when learners also speak the language with someone.' }
    ],
    stem: 'What do teachers warn about phone-based learning?',
    options: [
      'It is too expensive for most people.',
      'Short lessons are not enough without speaking practice.',
      'It can only be used on the way to work.',
      'The lessons are too long to finish.'
    ],
    answer: 1,
    explain: '「short lessons work best when learners also speak the language with someone」——光靠短课不够，还得开口练。',
    summary: '用手机学外语的人五年翻倍，五分钟短课最受欢迎，但老师提醒还要真人开口练习。'
  },
  {
    id: 'c4-m13',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2021 年 12 月 · 卷 B',
    year: 2021,
    material: [
      { speaker: 'M', text: 'I am thinking of moving into a shared flat near the campus.' },
      { speaker: 'W', text: 'How many people would you share with?' },
      { speaker: 'M', text: 'Three others, all postgraduate students. The rent is half of what I pay now.' },
      { speaker: 'W', text: 'Sounds good, but check the kitchen and the bathroom before you sign anything.' }
    ],
    stem: 'What does the woman advise the man to check?',
    options: [
      'The number of flatmates.',
      'The kitchen and the bathroom.',
      'The distance to the campus.',
      'The rent contract length.'
    ],
    answer: 1,
    explain: '「check the kitchen and the bathroom before you sign anything」——签约前先看厨房和卫生间。',
    summary: '男生想搬进四人合租的研究生公寓，房租减半；女士提醒签约前先看厨房和卫生间。'
  },
  {
    id: 'c4-m14',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2022 年 6 月 · 卷 A',
    year: 2022,
    material: [
      { speaker: 'N', text: 'Some companies now give new employees a "quiet week": five days with no meetings.' },
      { speaker: 'N', text: 'The aim is to let people read documents and learn the systems at their own pace.' },
      { speaker: 'N', text: 'Managers say newcomers ask better questions after that week.' }
    ],
    stem: 'What is the purpose of the quiet week?',
    options: [
      'To reduce the number of meetings for everyone.',
      'To let new employees learn at their own pace.',
      'To test how well people work alone.',
      'To give managers a short holiday.'
    ],
    answer: 1,
    explain: '「let people read documents and learn the systems at their own pace」——让新人按自己的节奏熟悉工作。',
    summary: '有公司给新人「安静周」，五天不开会，让他们自己看资料学系统，之后提问质量更高。'
  },
  {
    id: 'c4-m15',
    level: 'cet4',
    mode: 'mock',
    section: '新闻',
    source: '2022 年 12 月 · 卷 B',
    year: 2022,
    material: [
      { speaker: 'N', text: 'A mountain village has repaired its old stone bridge after a two-year fundraising campaign.' },
      { speaker: 'N', text: 'Most of the money came from former villagers living in cities.' },
      { speaker: 'N', text: 'The bridge is now used by children walking to the primary school.' }
    ],
    stem: 'Who provided most of the money for the repair?',
    options: [
      'The local government.',
      'Former villagers now living in cities.',
      'A travel company.',
      'The primary school.'
    ],
    answer: 1,
    explain: '「Most of the money came from former villagers living in cities」——资金主要来自进城的老村民。',
    summary: '山村募资两年修好石桥，钱多是进城老村民捐的，如今孩子上学走这座桥。'
  },
  {
    id: 'c4-m16',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2023 年 6 月 · 卷 A',
    year: 2023,
    material: [
      { speaker: 'W', text: 'My laptop battery dies after two hours. The shop says the battery is not covered.' },
      { speaker: 'M', text: 'When did you buy it? The law gives you a year for battery faults.' },
      { speaker: 'W', text: 'Eleven months ago. I still have the receipt on my phone.' },
      { speaker: 'M', text: 'Then go back and ask for the manager. Mention the year and show the receipt.' }
    ],
    stem: 'What does the man suggest the woman do?',
    options: [
      'Buy a new battery online.',
      'Ask for the manager and mention the one-year rule.',
      'Return the laptop for a full refund.',
      'Send the laptop to the manufacturer.'
    ],
    answer: 1,
    explain: '他让她「ask for the manager. Mention the year and show the receipt」——找经理并说明一年保修期。',
    summary: '女生电脑电池两小时就没电，店方说不在保修内；男生指出法律给一年电池保修，让她带收据找经理。'
  },
  {
    id: 'c4-m17',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2023 年 12 月 · 卷 B',
    year: 2023,
    material: [
      { speaker: 'N', text: 'A group of students built a small weather station on the roof of their school.' },
      { speaker: 'N', text: 'The station sends temperature and rainfall data to a website every ten minutes.' },
      { speaker: 'N', text: 'Other classes now use the data in geography lessons.' }
    ],
    stem: 'How is the weather data used by other classes?',
    options: [
      'It is sold to a local radio station.',
      'It is used in geography lessons.',
      'It is posted to parents every week.',
      'It is stored without being used.'
    ],
    answer: 1,
    explain: '「Other classes now use the data in geography lessons」——其他班级在地理课上用这些数据。',
    summary: '学生自建小型气象站，每十分钟上传气温与降雨数据，地理课直接拿来用。'
  },
  {
    id: 'c4-m18',
    level: 'cet4',
    mode: 'mock',
    section: '新闻',
    source: '2024 年 6 月 · 卷 A',
    year: 2024,
    material: [
      { speaker: 'N', text: 'The city will replace ten thousand street lights with lamps that use half the electricity.' },
      { speaker: 'N', text: 'Work starts in March and should finish before next winter.' },
      { speaker: 'N', text: 'Officials say the change will pay for itself in about four years.' }
    ],
    stem: 'What is the advantage of the new street lights?',
    options: [
      'They use much less electricity.',
      'They are much brighter than before.',
      'They can be repaired more cheaply.',
      'They can be controlled by phone.'
    ],
    answer: 0,
    explain: '「lamps that use half the electricity」——用电量只有原来的一半。',
    summary: '全市一万盏路灯换成省电一半的灯，三月开工、入冬前完工，约四年回本。'
  },
  {
    id: 'c4-m19',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2024 年 12 月 · 卷 B',
    year: 2024,
    material: [
      { speaker: 'M', text: 'I am applying for the summer programme in Singapore. Do I need a language test?' },
      { speaker: 'W', text: 'Not if your courses were taught in English. Then a letter from your university is enough.' },
      { speaker: 'M', text: 'My courses are in Chinese, but I have an old test result.' },
      { speaker: 'W', text: 'Check how old it is. Results older than two years are usually not accepted.' }
    ],
    stem: 'What does the woman say about old test results?',
    options: [
      'They must be sent by post.',
      'Results over two years old are usually not accepted.',
      'They can replace the university letter.',
      'They are only needed for Chinese courses.'
    ],
    answer: 1,
    explain: '「Results older than two years are usually not accepted」——超过两年的成绩通常不认。',
    summary: '申请新加坡暑期项目：全英文授课只要学校证明；成绩超两年通常不被接受。'
  },
  {
    id: 'c4-m20',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2025 年 6 月 · 卷 A',
    year: 2025,
    material: [
      { speaker: 'N', text: 'Two friends in a small town started a repair café where people bring broken things and fix them together.' },
      { speaker: 'N', text: 'On the first Saturday of every month, volunteers help with chairs, radios, clothes and bicycles.' },
      { speaker: 'N', text: 'The café has saved more than three hundred items from being thrown away.' }
    ],
    stem: 'What happens at the repair café?',
    options: [
      'People buy second-hand goods cheaply.',
      'Volunteers help people repair their broken items.',
      'Old furniture is thrown away safely.',
      'New products are exchanged for old ones.'
    ],
    answer: 1,
    explain: '「people bring broken things and fix them together」——志愿者与居民一起修东西。',
    summary: '小镇两人开了「修理咖啡屋」，每月第一个周六一起修椅子、收音机、衣服和自行车，已救回三百多件物品。'
  },
  {
    id: 'c4-m21',
    level: 'cet4',
    mode: 'mock',
    section: '新闻',
    source: '2025 年 12 月 · 卷 B',
    year: 2025,
    material: [
      { speaker: 'N', text: 'A university library will open a 24-hour study room for final exam weeks.' },
      { speaker: 'N', text: 'The room has one hundred seats and free hot water.' },
      { speaker: 'N', text: 'Students must leave their seats after ninety minutes if the room is full.' }
    ],
    stem: 'What happens if the study room is full?',
    options: [
      'Students must leave the library.',
      'Students must give up their seat after ninety minutes.',
      'New students cannot enter after midnight.',
      'Students have to pay for longer stays.'
    ],
    answer: 1,
    explain: '「Students must leave their seats after ninety minutes if the room is full」——满座时九十分钟要让位。',
    summary: '大学图书馆期末开 24 小时自习室，一百个座位、免费热水，满座九十分钟轮换。'
  },
  {
    id: 'c4-m22',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2026 年 6 月 · 卷 A',
    year: 2026,
    material: [
      { speaker: 'N', text: 'Deliveries by bicycle in the city centre have grown by forty per cent in two years.' },
      { speaker: 'N', text: 'Companies say bicycles are faster than vans in narrow streets and need no parking.' },
      { speaker: 'N', text: 'Some riders now earn the same as drivers, though they work fewer hours.' }
    ],
    stem: 'Why are companies using bicycles for delivery?',
    options: [
      'They are faster in narrow streets and need no parking.',
      'They are cheaper to repair than vans.',
      'The city has banned vans in the centre.',
      'Customers prefer bicycles in winter.'
    ],
    answer: 0,
    explain: '「bicycles are faster than vans in narrow streets and need no parking」——窄街更快、不用停车位。',
    summary: '市中心自行车送快递两年增四成，公司说窄街比面包车快且不用车位，骑手时薪已与司机相当。'
  },
  {
    id: 'c4-m23',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2026 年 6 月 · 卷 B',
    year: 2026,
    material: [
      { speaker: 'W', text: 'My parents want me to take the civil service exam, but I would rather work in a museum.' },
      { speaker: 'M', text: 'Have you told them about the museum internship you were offered?' },
      { speaker: 'W', text: 'Not yet. They will say it is not stable enough.' },
      { speaker: 'M', text: 'Show them the salary and the training plan. Facts work better than arguments.' }
    ],
    stem: 'What does the man advise the woman to do?',
    options: [
      'Take the civil service exam to please her parents.',
      'Show her parents the internship details.',
      'Refuse to discuss the topic with her parents.',
      'Look for a job in another city.'
    ],
    answer: 1,
    explain: '「Show them the salary and the training plan」——用具体信息（薪资、培养计划）说服父母。',
    summary: '女生想进博物馆、父母希望她考公，男生建议把实习的薪资和培养计划摆出来讲。'
  },
  {
    id: 'c4-m24',
    level: 'cet4',
    mode: 'mock',
    section: '短文',
    source: '2025 年 6 月 · 卷 B',
    year: 2025,
    material: [
      { speaker: 'N', text: 'A new study found that students who take notes by hand remember more than those who type.' },
      { speaker: 'N', text: 'Writing slows people down, so they must decide what matters.' },
      { speaker: 'N', text: 'Typing, by contrast, often turns into copying word for word.' }
    ],
    stem: 'Why do hand-written notes work better?',
    options: [
      'They are neater and easier to read.',
      'Writing forces people to choose what matters.',
      'Students type more slowly than they write.',
      'Typed notes cannot be searched.'
    ],
    answer: 1,
    explain: '「Writing slows people down, so they must decide what matters」——手写慢，迫使你筛选重点。',
    summary: '研究发现手写笔记记得更牢：手写慢，逼人筛选重点；打字容易变成逐字抄。'
  },
  {
    id: 'c4-m25',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    source: '2024 年 6 月 · 卷 B',
    year: 2024,
    material: [
      { speaker: 'M', text: 'The gym is offering a free health check this week. Should I go?' },
      { speaker: 'W', text: 'Yes, but do not eat for two hours before it. They take a blood sample.' },
      { speaker: 'M', text: 'I usually have breakfast at seven. The check is at nine.' },
      { speaker: 'W', text: 'Then eat after the check. Bring your student card as well.' }
    ],
    stem: 'What should the man do before the health check?',
    options: [
      'Eat a light breakfast at seven.',
      'Avoid eating for two hours.',
      'Drink a lot of water.',
      'Bring a blood sample with him.'
    ],
    answer: 1,
    explain: '女士说「do not eat for two hours before it」，因为要抽血。',
    summary: '健身房免费体检，女士提醒抽血前两小时别吃东西，并带上学生证。'
  },
  {
    id: 'c4-m26',
    level: 'cet4',
    mode: 'mock',
    section: '新闻',
    source: '2023 年 12 月 · 卷 A',
    year: 2023,
    material: [
      { speaker: 'N', text: 'A coastal city will plant ten thousand trees along its sea wall to protect it from storms.' },
      { speaker: 'N', text: 'The trees are expected to reach full height in eight years.' },
      { speaker: 'N', text: 'Engineers say the trees alone are not enough; the wall will also be raised by one metre.' }
    ],
    stem: 'What will the city do in addition to planting trees?',
    options: [
      'Build a new sea wall.',
      'Raise the existing wall by one metre.',
      'Move the road further inland.',
      'Close the beach during storms.'
    ],
    answer: 1,
    explain: '「the wall will also be raised by one metre」——除了种树，还把海堤加高一米。',
    summary: '沿海城市在防波堤边种一万棵树防风暴，八年成林；工程师说还需把堤加高一米。'
  }
]
