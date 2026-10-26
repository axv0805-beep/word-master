import type { ListeningItem } from '../../core/listening'

/**
 * 四级听力 · 专项训练题库。
 * 材料按四六级听力的常见场景与出题套路原创（短对话 / 长对话 / 短文 / 新闻），
 * 音频走系统语音合成，所以正文写口语化的短句，读起来更自然。
 */

export const CET4_DRILL: ListeningItem[] = [
  {
    id: 'c4-d01',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'Do you know when the library closes today?' },
      { speaker: 'W', text: 'Normally at nine, but during exam week it stays open until eleven.' }
    ],
    stem: 'What does the woman mean?',
    options: [
      'The library is closed today.',
      'The library closes later this week.',
      'The library closes at eleven every day.',
      'She has no idea about the closing time.'
    ],
    answer: 1,
    explain: '她说「平时九点关，考试周会开到十一点」，说明这周会关得更晚。',
    summary: '男生问图书馆几点关门，女生说平时九点，考试周延长到十一点。'
  },
  {
    id: 'c4-d02',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'The soup is cold and the fish tastes strange.' },
      { speaker: 'M', text: 'I am terribly sorry. Let me take it back and bring you a fresh one.' }
    ],
    stem: 'What will the man probably do next?',
    options: [
      'Bring the woman another dish.',
      'Ask the woman to pay the bill.',
      'Take the woman to another restaurant.',
      'Explain how the fish is cooked.'
    ],
    answer: 0,
    explain: '「take it back and bring you a fresh one」= 把菜退回去换一份新的。',
    summary: '顾客嫌汤凉、鱼味道怪，服务员道歉并端回一份新的。'
  },
  {
    id: 'c4-d03',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'I was going to drive to the station, but my car broke down again.' },
      { speaker: 'W', text: 'Then take the subway. It is faster than driving during rush hour anyway.' }
    ],
    stem: 'What does the woman advise the man to do?',
    options: [
      'Repair his car right away.',
      'Leave home earlier than usual.',
      'Take public transport to the station.',
      'Ask a friend to give him a ride.'
    ],
    answer: 2,
    explain: '女士让他「take the subway」，也就是改乘公共交通。',
    summary: '男士的车又坏了，女士建议他坐地铁，说高峰时段比开车快。'
  },
  {
    id: 'c4-d04',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'I have been waiting here for forty minutes. The bus should have come twice.' },
      { speaker: 'M', text: 'There is a marathon downtown today, so most bus lines are running late.' }
    ],
    stem: 'Why is the bus late?',
    options: [
      'The driver is on strike.',
      'A road event is causing delays.',
      'The bus broke down on the way.',
      'The woman is at the wrong stop.'
    ],
    answer: 1,
    explain: '「There is a marathon downtown today, so most bus lines are running late」——市区有马拉松，导致多数线路晚点。',
    summary: '女士等公交等了四十分钟，男士解释说市区今天办马拉松，公交都晚点了。'
  },
  {
    id: 'c4-d05',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'Could you help me with this statistics problem after class?' },
      { speaker: 'W', text: 'I would love to, but I have a part-time job until seven. Could we do it online at eight?' }
    ],
    stem: 'What does the woman suggest?',
    options: [
      'They meet in the library instead.',
      'They discuss the problem online at eight.',
      'The man should ask the teacher.',
      'She cannot help him at all.'
    ],
    answer: 1,
    explain: '她说打工到七点，然后提议「do it online at eight」，也就是八点线上讨论。',
    summary: '男生想请教统计题，女生说打工到七点，提议八点线上一起看。'
  },
  {
    id: 'c4-d06',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'The rent is five hundred more than last year. I am not sure I can afford it.' },
      { speaker: 'M', text: 'My landlord did the same. Look at the bright side: the subway line opened nearby.' }
    ],
    stem: 'How does the man react to the rent increase?',
    options: [
      'He thinks it is completely unreasonable.',
      'He suggests moving to another area.',
      'He points out an upside of the location.',
      'He offers to help pay the rent.'
    ],
    answer: 2,
    explain: '「Look at the bright side」是「往好处想」，他提到附近新开了地铁线，也就是一个优点。',
    summary: '女生抱怨房租涨了五百，男生说自己也涨了，但提醒她附近刚通地铁。'
  },
  {
    id: 'c4-d07',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'I signed up for the marathon, but I hurt my knee last weekend.' },
      { speaker: 'W', text: 'That is a shame. Why not switch to the ten-kilometer walk? It is easier on the knees.' }
    ],
    stem: 'What does the woman suggest?',
    options: [
      'Giving up the event completely.',
      'Seeing a doctor before deciding.',
      'Choosing a shorter, gentler event.',
      'Asking for a refund of the entry fee.'
    ],
    answer: 2,
    explain: '她建议改成十公里健走，对膝盖负担小，即选一个强度更低的项目。',
    summary: '男生报了马拉松却伤了膝盖，女生建议他改成十公里健走。'
  },
  {
    id: 'c4-d08',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'My phone screen cracked and it keeps shutting down.' },
      { speaker: 'M', text: 'There is a repair shop under the bridge. They fixed mine in half an hour.' }
    ],
    stem: 'What does the man tell the woman about the repair shop?',
    options: [
      'It is often very crowded.',
      'It is quick and he has used it.',
      'It is too expensive for students.',
      'It only sells new phones.'
    ],
    answer: 1,
    explain: '「They fixed mine in half an hour」既说明他本人用过，也说明修得很快。',
    summary: '女生手机屏碎了还总关机，男生推荐桥下那家维修店，说自己半小时就修好了。'
  },
  {
    id: 'c4-d09',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'Did you enjoy the museum visit on Sunday?' },
      { speaker: 'W', text: 'The paintings were beautiful, but I could hardly hear the guide with all those school groups.' }
    ],
    stem: 'What bothered the woman during the visit?',
    options: [
      'The museum was closed early.',
      'The paintings were hard to see.',
      'The noise made it hard to follow the guide.',
      'She could not find the guide at all.'
    ],
    answer: 2,
    explain: '「I could hardly hear the guide with all those school groups」——人多太吵，听不清讲解。',
    summary: '女士说画很好看，但学生团太多、太吵，几乎听不清讲解。'
  },
  {
    id: 'c4-d10',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'I am thinking about dropping the film course. I have three papers due next week.' },
      { speaker: 'M', text: 'Before you drop it, ask the professor for an extension. Most of them are reasonable.' }
    ],
    stem: 'What does the man suggest the woman do first?',
    options: [
      'Ask her professor for more time.',
      'Finish all three papers this week.',
      'Take the course next semester.',
      'Drop one of her other courses.'
    ],
    answer: 0,
    explain: '他让她退课之前先「ask the professor for an extension」，也就是先申请延期。',
    summary: '女生想退掉电影课，男生建议先跟教授申请延期，多数老师都讲道理。'
  },
  {
    id: 'c4-d11',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'Do you still have that umbrella you borrowed last month?' },
      { speaker: 'W', text: 'It is in my office. I keep forgetting to bring it back, but tomorrow, I promise.' }
    ],
    stem: 'What does the woman promise to do?',
    options: [
      'Buy the man a new umbrella.',
      'Return the umbrella tomorrow.',
      'Leave the umbrella in his office.',
      'Tell him which shop sells umbrellas.'
    ],
    answer: 1,
    explain: '「I keep forgetting to bring it back, but tomorrow, I promise」——她承诺明天还伞。',
    summary: '男士问上个月借的伞，女士说在办公室，保证明天还。'
  },
  {
    id: 'c4-d12',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'This is my first time cooking for more than ten people. I am nervous.' },
      { speaker: 'M', text: 'Relax. Make the pasta dish you practiced last week, and I will bring dessert.' }
    ],
    stem: 'What will the man bring?',
    options: [
      'A pasta dish.',
      'Some dessert.',
      'Several bottles of drinks.',
      'A cookbook for beginners.'
    ],
    answer: 1,
    explain: '男士说「I will bring dessert」——他负责带甜品。',
    summary: '女士第一次给十几个人做饭很紧张，男士让她做上周练过的意面，自己带甜品。'
  },
  {
    id: 'c4-d13',
    level: 'cet4',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'Excuse me, you look like you work here. Where can I find the job board?' },
      { speaker: 'W', text: 'Second floor, next to the careers office. Are you looking for something on campus?' },
      { speaker: 'M', text: 'Yes. I have a database exam in three weeks, so I need something with short hours.' },
      { speaker: 'W', text: 'Then try the library shelving team. They let students choose two evenings after six o\'clock.' }
    ],
    stem: 'What kind of job does the man want?',
    options: [
      'A job that pays the most.',
      'A job with flexible short hours.',
      'A job that can turn into a full-time post.',
      'A job in the careers office.'
    ],
    answer: 1,
    explain: '他强调三周后有考试，需要「something with short hours」，也就是时间少、好安排的兼职。',
    summary: '男生即将考试，想找时间短的校内兼职，女生推荐图书馆上架岗，可自选两个晚班。'
  },
  {
    id: 'c4-d14',
    level: 'cet4',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'How was the apartment viewing this morning?' },
      { speaker: 'M', text: 'The flat itself was great, but it is twenty minutes from the nearest bus stop.' },
      { speaker: 'W', text: 'That is far. Do you have a bicycle?' },
      { speaker: 'M', text: 'I do. Still, I am worried about rain in winter, and the rent does not seem negotiable.' }
    ],
    stem: 'What is the man mainly worried about?',
    options: [
      'The condition of the flat.',
      'The distance and the winter weather.',
      'The rent being too low.',
      'The lack of parking space.'
    ],
    answer: 1,
    explain: '他提到离公交站二十分钟、担心冬天下雨，说明主要顾虑是通勤与天气，而不是房子质量。',
    summary: '男生看房后觉得房子好，但离公交站远、冬天下雨不方便，租金也谈不下来。'
  },
  {
    id: 'c4-d15',
    level: 'cet4',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'I am planning my first trip to Beijing. Any advice for a student on a budget?' },
      { speaker: 'W', text: 'Take the night train. It saves a night of hotel money and you arrive fresh in the morning.' },
      { speaker: 'M', text: 'Is it comfortable?' },
      { speaker: 'W', text: 'Not as comfortable as a plane, but it depends on your seat. A sleep couch is worth the extra money.' }
    ],
    stem: 'Why does the woman recommend the night train?',
    options: [
      'It is faster than a plane.',
      'It saves both time and hotel money.',
      'It offers free meals on board.',
      'It stops at more scenic places.'
    ],
    answer: 1,
    explain: '「It saves a night of hotel money and you arrive fresh in the morning」——省一晚住宿费，早上还能直接玩。',
    summary: '女生建议预算有限的学生坐夜车，省住宿费又不耽误白天；想要舒服就多花钱买卧铺。'
  },
  {
    id: 'c4-d16',
    level: 'cet4',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'The group project is due on Friday, and nobody has written the introduction.' },
      { speaker: 'M', text: 'I can do it after tonight\'s club meeting, but I need the other parts by Thursday morning.' },
      { speaker: 'W', text: 'That is fair. I will collect the data sections tonight and send them to you.' },
      { speaker: 'M', text: 'Perfect. Then we only need to check the numbers together on Thursday evening.' }
    ],
    stem: 'What will the woman do tonight?',
    options: [
      'Write the introduction.',
      'Attend the club meeting.',
      'Collect the data sections and send them.',
      'Check the numbers with the man.'
    ],
    answer: 2,
    explain: '女士说「I will collect the data sections tonight and send them to you」，写引言是男生的事。',
    summary: '小组作业周五要交还缺引言，男生今晚开会后写，女生今晚收数据发他，周四晚一起核对。'
  },
  {
    id: 'c4-d17',
    level: 'cet4',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'My doctor says I should exercise more, but the gym next to my flat is expensive.' },
      { speaker: 'W', text: 'The university has a free fitness room for students. I use it four times a week.' },
      { speaker: 'M', text: 'Do I need to book it?' },
      { speaker: 'W', text: 'Only the machines. The running track is always open. You just show your student card.' }
    ],
    stem: 'What does the woman say about the university fitness room?',
    options: [
      'It is only for students in the sports school.',
      'Some machines need booking but the track does not.',
      'It requires a monthly payment.',
      'It is closed in the evening.'
    ],
    answer: 1,
    explain: '「Only the machines. The running track is always open」——只有器械要预约，跑道随时开放。',
    summary: '男生嫌健身房贵，女生推荐学校免费健身室：器械要预约，跑道随时开，刷学生卡即可。'
  },
  {
    id: 'c4-d18',
    level: 'cet4',
    mode: 'drill',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'I heard you changed your major. Was it because of the maths courses?' },
      { speaker: 'M', text: 'Partly. But the real reason is that I spent every weekend editing videos and loving it.' },
      { speaker: 'W', text: 'So media studies suits you better?' },
      { speaker: 'M', text: 'Exactly. My parents were worried, but my new adviser said my portfolio was strong enough.' }
    ],
    stem: 'Why did the man change his major?',
    options: [
      'He failed the maths courses.',
      'He found what he really enjoys doing.',
      'His parents asked him to change.',
      'The new major is easier to pass.'
    ],
    answer: 1,
    explain: '「the real reason is that I spent every weekend editing videos and loving it」——真正原因是喜欢做视频，不是成绩不好。',
    summary: '男生转专业不是因数学成绩，而是喜欢剪视频；新专业的导师也认可他的作品集。'
  },
  {
    id: 'c4-d19',
    level: 'cet4',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'Many students buy a bicycle when they arrive on campus, and then forget one simple thing: a good lock.' },
      { speaker: 'N', text: 'Cheap locks can be cut in seconds, while a proper lock costs less than a new bike.' },
      { speaker: 'N', text: 'Write down your bicycle number as well. It is the first thing the campus police ask for.' }
    ],
    stem: 'What does the speaker suggest students do?',
    options: [
      'Buy the cheapest bicycle they can find.',
      'Buy a proper lock and record the bicycle number.',
      'Park bicycles inside their dormitories.',
      'Avoid riding bicycles in winter.'
    ],
    answer: 1,
    explain: '短文说便宜锁几秒就能剪断、要买好锁，并写下自行车编号——对应买好锁并记录编号。',
    summary: '校园里自行车失窃多，建议买好一点的锁，并记下车架编号方便报失。'
  },
  {
    id: 'c4-d20',
    level: 'cet4',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'The city library has started a tool borrowing service. Members can borrow a drill, a ladder or a sewing machine for up to three days.' },
      { speaker: 'N', text: 'The idea came from a student survey: most people only need these tools once or twice a year.' },
      { speaker: 'N', text: 'Since the service opened, members have borrowed more than two thousand items.' }
    ],
    stem: 'Why did the library start the tool service?',
    options: [
      'A survey showed people rarely need such tools.',
      'The library wanted to sell old equipment.',
      'Tools were being stolen from the library.',
      'Students asked for free repairs.'
    ],
    answer: 0,
    explain: '「most people only need these tools once or twice a year」——调查显示大家一年只用一两次，所以共享更划算。',
    summary: '图书馆推出工具借用服务，源于调查：多数人一年只用一两次，共享比自购划算。'
  },
  {
    id: 'c4-d21',
    level: 'cet4',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'Sleep experts say students usually lose about an hour of sleep during exam weeks.' },
      { speaker: 'N', text: 'Staying up to study often costs more than it gives: memory works better after rest.' },
      { speaker: 'N', text: 'A short walk before bed helps more than another cup of coffee.' }
    ],
    stem: 'What do the experts advise students to do?',
    options: [
      'Study longer by drinking more coffee.',
      'Get enough rest and take a short walk before bed.',
      'Sleep during the day and study at night.',
      'Take sleeping pills during exams.'
    ],
    answer: 1,
    explain: '「memory works better after rest」以及「A short walk before bed helps more than another cup of coffee」——要休息够、睡前走走，而不是灌咖啡。',
    summary: '专家说考试周学生常少睡一小时，熬夜划不来：休息后记忆更好，睡前散步比咖啡有用。'
  },
  {
    id: 'c4-d22',
    level: 'cet4',
    mode: 'drill',
    section: '短文',
    material: [
      { speaker: 'N', text: 'The number of second-hand bookshops near the university has grown from three to eleven in two years.' },
      { speaker: 'N', text: 'Owners say students are more willing to trade books than to buy new ones.' },
      { speaker: 'N', text: 'One shop now runs a small reading corner, which becomes very busy before final exams.' }
    ],
    stem: 'What is happening to second-hand bookshops near the university?',
    options: [
      'They are closing because of online shopping.',
      'They are becoming more popular with students.',
      'They only sell new textbooks.',
      'They are moving into the university.'
    ],
    answer: 1,
    explain: '店铺两年从 3 家增到 11 家，学生更愿交换旧书，说明二手书店越来越受欢迎。',
    summary: '大学附近二手书店两年从三家增到十一家，学生更愿换书，店家还开了看书的角落。'
  },
  {
    id: 'c4-d23',
    level: 'cet4',
    mode: 'drill',
    section: '新闻',
    material: [
      { speaker: 'N', text: 'A new high-speed train line opened on Monday, cutting the journey between the two cities from five hours to just over two.' },
      { speaker: 'N', text: 'Officials expect the line to carry about thirty thousand passengers a day.' }
    ],
    stem: 'What is the main benefit of the new train line?',
    options: [
      'Much shorter travel time.',
      'Lower ticket prices.',
      'Fewer passengers per train.',
      'New stations in the city centre.'
    ],
    answer: 0,
    explain: '「cutting the journey ... from five hours to just over two」——通行时间从五小时降到两小时出头。',
    summary: '两城之间新开高铁线，通行时间由五小时缩到两小时出头，日均客流预计三万。'
  },
  {
    id: 'c4-d24',
    level: 'cet4',
    mode: 'drill',
    section: '新闻',
    material: [
      { speaker: 'N', text: 'Heavy rain flooded several streets in the south of the city on Sunday night.' },
      { speaker: 'N', text: 'No injuries were reported, but drivers were asked to avoid the area until Monday noon.' }
    ],
    stem: 'What were drivers asked to do?',
    options: [
      'Help clean the street surface.',
      'Avoid the flooded area until Monday noon.',
      'Drive more slowly in the city centre.',
      'Use public transport for a week.'
    ],
    answer: 1,
    explain: '「drivers were asked to avoid the area until Monday noon」——司机被要求周一中午前绕开该区域。',
    summary: '周日夜里暴雨淹了城南几条街，无人受伤，司机被要求周一中午前绕行。'
  },
  {
    id: 'c4-d25',
    level: 'cet4',
    mode: 'drill',
    section: '新闻',
    material: [
      { speaker: 'N', text: 'The city museum will open a free night session every Friday from next month.' },
      { speaker: 'N', text: 'Visitors can join guided tours at seven and nine, but must book a place online in advance.' }
    ],
    stem: 'What do visitors need to do for the night session?',
    options: [
      'Buy a ticket at the door.',
      'Book a place online in advance.',
      'Arrive before seven in the evening.',
      'Join a membership programme.'
    ],
    answer: 1,
    explain: '「must book a place online in advance」——需提前线上预约，而且是免费的。',
    summary: '市博物馆下月起每周五开放免费夜场，七点和九点有导览，需提前网上预约。'
  },
  {
    id: 'c4-d26',
    level: 'cet4',
    mode: 'drill',
    section: '新闻',
    material: [
      { speaker: 'N', text: 'A student volunteer group repaired more than four hundred old bicycles this summer and gave them to new students.' },
      { speaker: 'N', text: 'This year the group plans to teach repair skills in weekend workshops as well.' }
    ],
    stem: 'What will the volunteer group do this year?',
    options: [
      'Sell the repaired bicycles.',
      'Hold workshops to teach repair skills.',
      'Ask new students to pay for bicycles.',
      'Stop repairing old bicycles.'
    ],
    answer: 1,
    explain: '「plans to teach repair skills in weekend workshops as well」——今年还会办周末的修理课。',
    summary: '学生志愿者暑期修了四百多辆旧车送给新生，今年还打算开周末修理课。'
  }
]
