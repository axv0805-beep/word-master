import type { ListeningItem } from '../../core/listening'

/**
 * 四级听力：全部为原创仿真材料，按四六级短对话 / 长对话 / 短文 / 新闻的常见出题套路写。
 * 用系统语音合成朗读，两个说话人分别走美音与英音，避免听起来像一个人在自言自语。
 */

export const CET4_DRILL: ListeningItem[] = [
  {
    id: 'c4-d1',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'Excuse me, do you know when the library closes today?' },
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
    explain: '她说「平时九点关，考试周会开到十一点」，也就是这周会关得更晚。',
    summary: '男生问图书馆几点关门，女生说平时九点，考试周延长到十一点。'
  },
  {
    id: 'c4-d2',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'The soup is a bit cold, and the fish tastes strange.' },
      { speaker: 'M', text: 'I am terribly sorry. Let me take it back and bring you a fresh one.' }
    ],
    stem: 'What will the man probably do next?',
    options: [
      'Bring the woman another dish.',
      'Ask the woman to pay first.',
      'Change the table for her.',
      'Tell her the fish is fresh.'
    ],
    answer: 0,
    explain: '男生说 take it back and bring you a fresh one，即把菜端回去换一份新的。',
    summary: '顾客抱怨汤凉了、鱼味道不对，服务员道歉并提出换一份。'
  },
  {
    id: 'c4-d3',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'I heard you moved to a new flat. How much is the rent now?' },
      { speaker: 'W', text: 'Twelve hundred a month, and it is only ten minutes on foot from the office.' }
    ],
    stem: 'Why is the woman satisfied with her new flat?',
    options: [
      'It is very cheap.',
      'It is close to her office.',
      'It has a big garden.',
      'Her friends live nearby.'
    ],
    answer: 1,
    explain: '她说走路十分钟到公司，也就是离办公室很近。',
    summary: '男生问租金，女生说每月一千二，走路十分钟到公司。'
  },
  {
    id: 'c4-d4',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'My laptop keeps shutting down when I open more than two windows.' },
      { speaker: 'M', text: 'That sounds like a memory problem. Bring it in on Friday and I will have a look.' }
    ],
    stem: 'What is the man going to do on Friday?',
    options: [
      'Sell the woman a new laptop.',
      'Teach her to use fewer windows.',
      'Examine her laptop.',
      'Borrow her laptop for a day.'
    ],
    answer: 2,
    explain: 'have a look 就是检查一下，男生判断是内存问题，让她周五把电脑带来看看。',
    summary: '女生说笔记本开多个窗口就关机，男生判断是内存问题，约周五带来检查。'
  },
  {
    id: 'c4-d5',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'M', text: 'The concert starts at seven thirty. Should we take the subway?' },
      { speaker: 'W', text: 'If we leave at six, the streets are still busy. The subway is safer.' }
    ],
    stem: 'How will they probably go to the concert?',
    options: ['By bus.', 'By car.', 'By taxi.', 'By subway.'],
    answer: 3,
    explain: '女生说路上还很堵、地铁更稳，所以两人会坐地铁。',
    summary: '两人商量去听音乐会，因为路上堵，决定坐地铁。'
  },
  {
    id: 'c4-d6',
    level: 'cet4',
    mode: 'drill',
    section: '短对话',
    material: [
      { speaker: 'W', text: 'Did you finish the report? The meeting is at two.' },
      { speaker: 'M', text: 'Almost. I still need to check the numbers, but I will send it before noon.' }
    ],
    stem: 'What does the man still need to do?',
    options: [
      'Print the report.',
      'Check the figures.',
      'Attend a meeting at noon.',
      'Write the report from the beginning.'
    ],
    answer: 1,
    explain: '男生说还需要 check the numbers，也就是核对数据。',
    summary: '女生问报告写完没有，男生说快好了，还要核对数字，中午前发。'
  }
]

export const CET4_MOCK: ListeningItem[] = [
  {
    id: 'c4-m1',
    level: 'cet4',
    mode: 'mock',
    section: '短篇新闻',
    material: [
      {
        speaker: 'N',
        text: 'A new study on sleep has found that students who keep regular hours do better in exams than those who study late into the night. The researchers followed two thousand middle school students for one year. They say the hours before midnight matter most, because the brain uses that time to store what was learned during the day.'
      }
    ],
    stem: 'What did the researchers find?',
    options: [
      'Late-night study improves memory.',
      'Regular sleep hours help exam results.',
      'Students need less sleep in exam weeks.',
      'Two thousand students failed their exams.'
    ],
    answer: 1,
    explain: '研究发现「作息规律的学生考试更好」，熬夜并不划算，效率反而更低。',
    summary: '一项睡醒研究发现，作息规律的学生考试成绩更好，零点前的睡眠对记忆最关键。'
  },
  {
    id: 'c4-m2',
    level: 'cet4',
    mode: 'mock',
    section: '短篇新闻',
    material: [
      {
        speaker: 'N',
        text: 'A small town in the north has turned its old train station into a public library. The station had been closed for eleven years. The local government kept the wooden benches and the big clock, and added more than ten thousand books. The library now opens seven days a week and is run almost completely by volunteers.'
      }
    ],
    stem: 'What do we learn about the library?',
    options: [
      'It was built in a former train station.',
      'It was opened by a private company.',
      'It only opens at weekends.',
      'It has fewer than a thousand books.'
    ],
    answer: 0,
    explain: '原文说把小火车站改成了图书馆，还保留了木长椅和挂钟。',
    summary: '北方小镇把废弃十一年的老车站改造成图书馆，保留木长椅和大挂钟，藏书一万多册。'
  },
  {
    id: 'c4-m3',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    material: [
      { speaker: 'W', text: 'Hi Peter, I am calling about the summer job at the city museum.' },
      { speaker: 'M', text: 'Oh yes, we still need someone for the front desk. Do you have time in July and August?' },
      { speaker: 'W', text: 'I do. But I have morning classes until the end of June. Could I start in July?' },
      { speaker: 'M', text: 'That works. The hours are ten to four, and the pay is sixty a day.' }
    ],
    stem: 'When can the woman start working?',
    options: ['In June.', 'In July.', 'In August.', 'In September.'],
    answer: 1,
    explain: '女生说她六月上旬还有早课，问能否七月开始，男生说可以。',
    summary: '女生电话求职博物馆前台工作，因六月还有课，约定七月开始，每天十点到四点，日薪六十。'
  },
  {
    id: 'c4-m4',
    level: 'cet4',
    mode: 'mock',
    section: '长对话',
    material: [
      { speaker: 'M', text: 'You look tired. Did the train take long?' },
      { speaker: 'W', text: 'Six hours! There was a problem with the line, so we had to wait an hour and a half in the middle of nowhere.' },
      { speaker: 'M', text: 'That is awful. Next time, the bus is probably faster. It only takes four hours.' },
      { speaker: 'W', text: 'I will keep that in mind for the trip back.' }
    ],
    stem: 'Why did the woman have such a long journey?',
    options: [
      'She missed the first train.',
      'She took the wrong line.',
      'The train was delayed on the way.',
      'The bus broke down in the middle.'
    ],
    answer: 2,
    explain: '她说线路出问题，在荒郊等了半小时，所以全程六个小时。',
    summary: '女生坐火车花了六小时，因为线路故障在途中等了一个半小时，男生建议回程坐大巴。'
  },
  {
    id: 'c4-m5',
    level: 'cet4',
    mode: 'mock',
    section: '听力篇章',
    material: [
      {
        speaker: 'N',
        text: 'Many people believe that taking notes with a pen is slower than typing, so it must be worse. A recent experiment suggests the opposite. Students who wrote notes by hand wrote far fewer words, yet they remembered more of the ideas. The reason is simple: when your hand is slow, your brain has to decide what matters, and that decision is what makes the memory stick.'
      }
    ],
    stem: 'Why did handwriting help students remember more?',
    options: [
      'They wrote down every word.',
      'They had to choose what was important.',
      'They wrote faster than they could type.',
      'They read the notes twice.'
    ],
    answer: 1,
    explain: '手写速度慢，大脑必须筛选重点，这个筛选过程让记忆更牢。',
    summary: '实验发现手记笔记的学生记得更多，因为手慢迫使大脑判断哪些内容重要。'
  },
  {
    id: 'c4-m6',
    level: 'cet4',
    mode: 'mock',
    section: '听力篇章',
    material: [
      {
        speaker: 'N',
        text: 'If you have ever planted a tree, you know the first year is the hardest. The young tree needs water almost every day, and a single storm can break it. But after three years, the roots are deep enough to find water on their own. The gardener in our town says the same is true of any new habit: the first months need daily care, and after that it begins to hold itself up.'
      }
    ],
    stem: 'What does the gardener compare a new habit to?',
    options: [
      'A storm.',
      'A young tree.',
      'A deep well.',
      'A garden tool.'
    ],
    answer: 1,
    explain: '园丁说新习惯和种树一样，头几个月要天天照料，之后就能自己站住。',
    summary: '园丁用种树打比方：头一年最难，三年后根深自足；新习惯也是这样，头几个月需要每天浇灌。'
  }
]
