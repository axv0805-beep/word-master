import type { ListeningItem } from '../../core/listening'

/**
 * 六级听力：材料更长、更偏推断，同样全部原创。
 * 出题套路参考六级短对话（含语气与数字）、长对话（多信息点）与讲座类短文。
 */

export const CET6_DRILL: ListeningItem[] = [
  {
    id: 'c6-d1',
    level: 'cet6',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'I thought the department would announce the scholarship list on Monday.' },
      { speaker: 'M', text: 'It was pushed back to Thursday. The committee is still arguing about the last two places.' }
    ],
    stem: 'What do we learn about the scholarship list?',
    options: [
      'It has already been announced.',
      'It will come out later than expected.',
      'Two students were removed from it.',
      'The committee cancelled it.'
    ],
    answer: 1,
    explain: '女生以为周一出，男的说推迟到周四，所以「比预期晚」。',
    summary: '奖学金名单原定周一公布，推迟到周四，因为委员会还在争最后两个名额。'
  },
  {
    id: 'c6-d2',
    level: 'cet6',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'The conference fee is three hundred, but students get half off.' },
      { speaker: 'W', text: 'Then it is worth going. I was going to skip it for the price.' }
    ],
    stem: 'What does the woman imply?',
    options: [
      'She has already paid the full fee.',
      'She will attend the conference.',
      'The conference is too expensive for anyone.',
      'She is not a student any more.'
    ],
    answer: 1,
    explain: '她本来要因为价格放弃，听说学生半价后觉得「值得去」，也就是她会参加。',
    summary: '会议费三百，学生半价；女生原本因价格打算放弃，现在决定去。'
  },
  {
    id: 'c6-d3',
    level: 'cet6',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'Professor Lee said the essay is due on the fifteenth, not the tenth.' },
      { speaker: 'M', text: 'That gives us five more days, but I would rather not rely on the extension again.' }
    ],
    stem: 'What is the man worried about?',
    options: [
      'The professor might change the date again.',
      'He has too little time to finish the essay.',
      'They may become too used to extensions.',
      'The essay topic is too difficult.'
    ],
    answer: 2,
    explain: '他说多给五天是好事，但不想再依赖延期，说明他担心养成拖到延期的习惯。',
    summary: '截止日从十号推到十五号，男生觉得不能总靠延期。'
  },
  {
    id: 'c6-d4',
    level: 'cet6',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'Did the interview go well? You look calmer than last time.' },
      { speaker: 'W', text: 'Much better. They asked about my project for twenty minutes and never mentioned my grades.' }
    ],
    stem: 'Why does the woman feel better about this interview?',
    options: [
      'The questions were about her own work.',
      'She was not asked any questions.',
      'Her grades were excellent.',
      'The interview was much shorter.'
    ],
    answer: 0,
    explain: '对方问了她二十分钟项目、完全没提成绩，所以是「问了她自己的东西」。',
    summary: '面试比上次顺利，对方聊了二十分钟她的项目，没提成绩。'
  },
  {
    id: 'c6-d5',
    level: 'cet6',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'The train leaves at six forty and the next one is not until nine.' },
      { speaker: 'M', text: 'Then we had better leave the hotel by five thirty. I do not want to sprint with two suitcases.' }
    ],
    stem: 'What does the man suggest?',
    options: [
      'Taking a later train.',
      'Leaving the hotel early.',
      'Checking out the night before.',
      'Taking a taxi to the station.'
    ],
    answer: 1,
    explain: '他提出五点半前离开酒店，免得拎着两个箱子狂奔。',
    summary: '火车六点四十发车，下一班要到九点，男生建议五点半就出发去车站。'
  },
  {
    id: 'c6-d6',
    level: 'cet6',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'The survey says most people would pay more for food that is grown nearby.' },
      { speaker: 'W', text: 'They say that in surveys. The question is whether they do it at the checkout.' }
    ],
    stem: 'What is the woman\'s attitude towards the survey result?',
    options: [
      'She fully agrees with it.',
      'She doubts it reflects real behaviour.',
      'She thinks the sample was too small.',
      'She believes the food is too expensive.'
    ],
    answer: 1,
    explain: '她说「问卷调查里大家都这么说，问题是结账时会不会这么做」，即她怀疑问卷结果不等于真实行为。',
    summary: '调查说多数人愿为本地食物多付钱，女生认为问卷和实际结账行为未必一致。'
  }
]

export const CET6_MOCK: ListeningItem[] = [
  {
    id: 'c6-m1',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'So how did the internship in the lab go? I heard you were there for three months.' },
      { speaker: 'W', text: 'It was worth it, but not for the reason I expected. I barely touched the experiments.' },
      { speaker: 'M', text: 'Then what did you do all day?' },
      {
        speaker: 'W',
        text: 'I cleaned data. Thousands of rows. And actually, that taught me more about how research really works than any lecture has.'
      }
    ],
    stem: 'What surprised the woman about her internship?',
    options: [
      'She was asked to leave early.',
      'She learned more from data work than from lectures.',
      'She did no practical work at all.',
      'The lab had too many students.'
    ],
    answer: 1,
    explain: '她说几乎没做实验、整天清数据，但这比听课更让她理解真实研究是怎么运转的。',
    summary: '三个月的实验室实习，女生几乎没做实验，主要清理数据，却因此更懂研究如何运转。'
  },
  {
    id: 'c6-m2',
    level: 'cet6',
    mode: 'mock',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'Our city wants to plant ten thousand trees along the river. Sounds great, does it not?' },
      { speaker: 'M', text: 'On paper. But the last time they did that, half of them died within a year because nobody was paid to water them.' },
      { speaker: 'W', text: 'So the problem is not planting, it is who looks after them afterwards.' },
      { speaker: 'M', text: 'Exactly. A tree costs forty to plant and another eighty to keep alive for three years.' }
    ],
    stem: 'What is the man\'s main point?',
    options: [
      'Planting trees is too expensive to start.',
      'Long-term care matters more than planting.',
      'The river bank is not suitable for trees.',
      'The city should plant more trees quickly.'
    ],
    answer: 1,
    explain: '他举上次一半树苗死掉的例子，指出问题在于「谁来养」而不是种，即长期养护更关键。',
    summary: '城市要沿河种树，男生指出上次因无人浇水死了一半，种一棵四十、养三年八十。'
  },
  {
    id: 'c6-m3',
    level: 'cet6',
    mode: 'mock',
    section: '讲话/讲座',
    material: [
      {
        speaker: 'N',
        text: 'When we talk about memory, we usually think of it as a cupboard where things are stored. But most researchers now describe it as a story we retell. Every time you remember a holiday, you slightly change it, because you are remembering the last time you remembered it. This is why two people can describe the same evening in completely different ways, and both be honest.'
      }
    ],
    stem: 'According to the speaker, why do memories change?',
    options: [
      'Because people lie about the past.',
      'Because each recall rewrites the memory.',
      'Because the brain stores too little information.',
      'Because people remember only happy events.'
    ],
    answer: 1,
    explain: '讲话说每次回忆其实是在回忆「上一次回忆」，会轻微改写，所以记忆不是柜子而是重讲的故事。',
    summary: '记忆不是存东西的柜子，而是不断重讲的故事，每次回忆都会轻微改写。'
  },
  {
    id: 'c6-m4',
    level: 'cet6',
    mode: 'mock',
    section: '讲话/讲座',
    material: [
      {
        speaker: 'N',
        text: 'Cities spend a great deal of money on new roads, expecting traffic to flow. But a road that is wider simply attracts more cars. Drivers see empty space and decide to use it. The result, after a few years, is the same jam as before. Planners call this induced demand, and it is one reason some cities now put the money into buses and bike lanes instead.'
      }
    ],
    stem: 'What is induced demand in this talk?',
    options: [
      'More roads lead to more cars.',
      'Drivers avoid new roads for years.',
      'Bike lanes reduce the number of cars.',
      'Cities cannot afford new roads.'
    ],
    answer: 0,
    explain: '新路更宽会吸引更多车流，几年后又堵回去，这个现象叫「诱发需求」。',
    summary: '修更宽的路会吸引更多车辆（诱发需求），几年后依旧拥堵，所以有城市改用公交与自行车道。'
  },
  {
    id: 'c6-m5',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    material: [
      {
        speaker: 'N',
        text: 'For years, scientists assumed that deep-sea fish could not see colour, because the only light down there is blue. A new camera lowered four thousand metres changed that. It recorded fish reacting to red light, which should be invisible in the deep. The likely explanation is that these animals produce their own red glow, and use it to hunt without being seen.'
      }
    ],
    stem: 'What did the new camera reveal?',
    options: [
      'Deep-sea fish can react to red light.',
      'Deep-sea fish are blind in the dark.',
      'Colour does not exist in the deep sea.',
      'The camera could not record any light.'
    ],
    answer: 0,
    explain: '相机拍到深海鱼对红光有反应，而深海本该看不到红光，说明它们可能自己发出红光来捕食。',
    summary: '深海摄像机发现深海鱼能对红光做出反应，推测它们自己发出红光以便隐蔽捕食。'
  },
  {
    id: 'c6-m6',
    level: 'cet6',
    mode: 'mock',
    section: '短文',
    material: [
      {
        speaker: 'N',
        text: 'A team studying office noise found that people were most distracted not by loud conversations, but by half-heard ones. A voice you can almost understand pulls at your attention every few seconds. Complete silence was also rated unhelpful, because people felt watched. The comfortable middle, the study found, was a steady low sound, like rain or a fan, which hid the details without hiding the room.'
      }
    ],
    stem: 'Which sound was found most distracting?',
    options: [
      'Loud conversations.',
      'Total silence.',
      'Speech you can partly understand.',
      'Steady rain or a fan.'
    ],
    answer: 2,
    explain: '研究说最分心的是「半听得懂」的说话声，因为大脑一直想去补全内容。',
    summary: '办公室最分心的不是大声说话，而是半听得懂的对话；完全安静也不舒服，稳定的低音（雨声、风扇）最好。'
  }
]
