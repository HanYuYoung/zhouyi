/* 观象：本地规则引擎 + 结构化卦象知识库。无网络请求，不保存问题正文到服务端。 */
const TRIGRAMS = {
  乾: { bits: "111", symbol: "☰", element: "天" },
  坤: { bits: "000", symbol: "☷", element: "地" },
  震: { bits: "100", symbol: "☳", element: "雷" },
  巽: { bits: "011", symbol: "☴", element: "风" },
  坎: { bits: "010", symbol: "☵", element: "水" },
  离: { bits: "101", symbol: "☲", element: "火" },
  艮: { bits: "001", symbol: "☶", element: "山" },
  兑: { bits: "110", symbol: "☱", element: "泽" },
};

const CATEGORY_LENS = {
  work: { label: "事业 / 学业", prefix: "放到事业与学习上看，" },
  relationship: { label: "关系 / 感情", prefix: "放到关系与感情上看，" },
  decision: { label: "选择 / 决策", prefix: "放到选择与决策上看，" },
  wealth: { label: "财务 / 投资", prefix: "放到财务与资源上看，" },
  health: { label: "身心 / 节奏", prefix: "放到身心与生活节奏上看，" },
  general: { label: "其他 / 综合", prefix: "放回当下整体处境看，" },
};

const HEX_DATA = [
  [1,"乾为天","Qian","乾","乾","刚健、自强、开创","元亨利贞。","天行健，君子以自强不息。","先立方向，再用持续行动兑现它。","过刚易折，别把坚持变成拒绝调整。","开始,领导,创造"],
  [2,"坤为地","Kun","坤","坤","承载、顺势、厚德","元亨，利牝马之贞。","地势坤，君子以厚德载物。","先接住现实，再在边界内稳步推进。","顺势不是失去主见，留意过度迁就。","承载,合作,耐心"],
  [3,"水雷屯","Zhun","坎","震","起步艰难、资源未齐","元亨利贞。勿用有攸往，利建侯。","云雷，屯；君子以经纶。","把大问题拆成第一步，先找同伴和资源。","初期混乱很正常，别用速度掩盖基础不足。","起步,困难,筹备"],
  [4,"山水蒙","Meng","艮","坎","启蒙、求教、建立方法","亨。匪我求童蒙，童蒙求我。","山下出泉，蒙；君子以果行育德。","承认未知，找到可靠的老师或方法再行动。","警惕自以为懂，重复验证比急着表态重要。","学习,请教,方法"],
  [5,"水天需","Xu","坎","乾","等待、蓄势、时机","有孚，光亨，贞吉。利涉大川。","云上于天，需；君子以饮食宴乐。","把等待变成准备，时机到时自然推进。","焦虑会催生错误承诺，勿用投机换确定感。","等待,时机,准备"],
  [6,"天水讼","Song","乾","坎","争讼、分歧、边界","有孚，窒惕，中吉，终凶。利见大人。","天与水违行，讼；君子以作事谋始。","先澄清事实与边界，必要时借助中立第三方。","赢了争辩不等于赢了关系，避免把冲突拖长。","争议,边界,沟通"],
  [7,"地水师","Shi","坤","坎","组织、纪律、带队","贞，丈人吉，无咎。","地中有水，师；君子以容民畜众。","明确角色、节奏和责任，按计划集中力量。","没有纪律的热情会消耗团队，别让一人扛所有事。","团队,组织,执行"],
  [8,"水地比","Bi","坎","坤","亲比、结盟、选择同道","吉。原筮元永贞，无咎。","地上有水，比；先王以建万国，亲诸侯。","选择价值观相近的人同行，先建立信任。","关系要有筛选，盲目合群会失去判断。","合作,信任,联盟"],
  [9,"风天小畜","Xiao Chu","巽","乾","小有积蓄、以柔制刚","亨。密云不雨，自我西郊。","风行天上，小畜；君子以懿文德。","用小步迭代积累势能，不必一次解决全部问题。","阻力尚在，暂缓公开承诺和过度扩张。","积累,克制,迭代"],
  [10,"天泽履","Lu","乾","兑","礼法、谨慎前行","履虎尾，不咥人，亨。","上天下泽，履；君子以辨上下，定民志。","尊重规则和对方边界，走稳每一步。","自信可以，冒犯不可；细节决定是否平安通过。","边界,礼法,谨慎"],
  [11,"地天泰","Tai","坤","乾","通泰、上下交流","小往大来，吉亨。","天地交，泰；后以财成天地之道。","让信息流动起来，主动促成资源与人的连接。","顺境也要留后手，避免把暂时顺利当成永久。","顺利,沟通,增长"],
  [12,"天地否","Pi","乾","坤","闭塞、沟通不畅","否之匪人，不利君子贞。大往小来。","天地不交，否；君子以俭德辟难。","先保住底线与能量，减少无效消耗，静待转机。","暂时的冷场不代表终局，不要在错误对象上硬求回应。","停滞,隔阂,收缩"],
  [13,"天火同人","Tong Ren","乾","离","同道、公开协作","同人于野，亨。利涉大川，利君子贞。","天与火，同人；君子以类族辨物。","把共同目标说清楚，公开地寻找同路人。","小圈子与偏见会限制视野，别只和相似的人合作。","协作,社群,共识"],
  [14,"火天大有","Da You","离","乾","丰盛、拥有、分享","元亨。","火在天上，大有；君子以遏恶扬善，顺天休命。","资源变多时更要分配得当，回馈让成果可持续。","拥有感容易变成控制欲，留意功劳与风险的失衡。","收获,资源,分享"],
  [15,"地山谦","Qian","坤","艮","谦退、平衡、留有余地","亨，君子有终。","地中有山，谦；君子以裒多益寡，称物平施。","降低姿态、补足短板，事情反而更容易推进。","谦逊不是自我否定，别把合理诉求也一并藏起来。","谦逊,平衡,积累"],
  [16,"雷地豫","Yu","震","坤","喜悦、动员、顺势","利建侯行师。","雷出地奋，豫；先王以作乐崇德。","把热情转成清晰的节奏，带动身边人一起做。","兴奋状态下容易高估能力，给计划设置检查点。","热情,动员,节奏"],
  [17,"泽雷随","Sui","兑","震","随时、跟随、借势","元亨利贞，无咎。","泽中有雷，随；君子以向晦入宴息。","观察趋势后顺势而为，保持可调整的姿态。","跟随不等于盲从，底线与节律不能交出去。","趋势,适应,跟随"],
  [18,"山风蛊","Gu","艮","巽","整顿、修复、处理旧问题","元亨，利涉大川。先甲三日，后甲三日。","山下有风，蛊；君子以振民育德。","先找出积弊源头，再分阶段修复。","只处理表面会反复，别把责任推给过去。","修复,整顿,复盘"],
  [19,"地泽临","Lin","坤","兑","临近、关怀、扩大影响","元亨利贞。至于八月有凶。","泽上有地，临；君子以教思无穷，容保民无疆。","靠近真实现场，持续倾听并给予支持。","趋势有周期，别因一时上升就忽略退潮预案。","靠近,管理,周期"],
  [20,"风地观","Guan","巽","坤","观察、示范、建立信任","盥而不荐，有孚颙若。","风行地上，观；先王以省方观民设教。","先观察全局和他人反应，再决定是否出手。","只看不做会错过窗口，观察后要落一个小行动。","观察,洞察,示范"],
  [21,"火雷噬嗑","Shi He","离","震","咬合、执法、排除障碍","亨。利用狱。","雷电，噬嗑；先王以明罚敕法。","直面卡点，用清晰规则把障碍拆掉。","强硬要有证据与尺度，别把人和问题混为一谈。","执行,规则,突破"],
  [22,"山火贲","Bi","艮","离","文饰、表达、适度美化","亨。小利有攸往。","山下有火，贲；君子以明庶政，无敢折狱。","先把核心内容做好，再用简洁表达增强理解。","外在包装不能代替实质，避免过度承诺。","表达,形象,简化"],
  [23,"山地剥","Bo","艮","坤","剥落、去旧、保全","不利有攸往。","山附于地，剥；上以厚下安宅。","先止损、保核心，允许不合适的部分自然退出。","逆势硬撑只会扩大损耗，暂时退让是策略。","止损,清理,保全"],
  [24,"地雷复","Fu","坤","震","复归、回到正轨","亨。出入无疾，朋来无咎。","雷在地中，复；先王以至日闭关。","回到真正重要的习惯，从小周期重新开始。","复归需要耐心，别因为一次反复就全盘放弃。","回归,重启,习惯"],
  [25,"天雷无妄","Wu Wang","乾","震","真实、无妄、顺其自然","元亨利贞。其匪正有眚，不利有攸往。","天下雷行，物与无妄；先王以茂对时育万物。","动机保持诚实，按事实而非幻想行动。","别为了证明自己而加戏，非必要的冒险要停下。","真实,诚意,自然"],
  [26,"山天大畜","Da Chu","艮","乾","蓄养、积蓄、约束力量","利贞。不家食吉，利涉大川。","天在山中，大畜；君子以多识前言往行。","把时间用来储备能力、信用和资源。","懂得收力，能力越大越要有边界与长期视野。","储备,能力,长期"],
  [27,"山雷颐","Yi","艮","震","颐养、摄取、言语","贞吉。观颐，自求口实。","山下有雷，颐；君子以慎言语，节饮食。","检查你正在输入什么，也检查自己如何输出。","过度消耗注意力与欲望，会让判断变钝。","滋养,输入,节制"],
  [28,"泽风大过","Da Guo","兑","巽","过重、非常时期、担当","栋桡，利有攸往，亨。","泽灭木，大过；君子以独立不惧，遁世无闷。","承认结构已超载，集中力量处理最关键的一件事。","不要靠个人英雄主义硬扛，必要时求援或换结构。","压力,担当,结构"],
  [29,"坎为水","Kan","坎","坎","重险、重复考验","习坎，有孚，维心亨，行有尚。","水洊至，习坎；君子以常德行，习教事。","保持固定节奏和求生本能，一关一关过。","恐惧会放大风险，先建立可控的小胜。","风险,坚持,韧性"],
  [30,"离为火","Li","离","离","明亮、依附、看见","利贞，亨。畜牝牛，吉。","明两作，离；大人以继明照于四方。","让事实和可见证据照亮下一步，依托可靠关系。","过于耀眼会灼伤自己，给情绪和身体留空间。","清晰,依托,洞见"],
  [31,"泽山咸","Xian","兑","艮","感应、吸引、互相影响","亨，利贞，取女吉。","山上有泽，咸；君子以虚受人。","放下预设，感受彼此真实的回应再靠近。","一时的吸引不等于长期承诺，别急着定义关系。","感受,吸引,回应"],
  [32,"雷风恒","Heng","震","巽","恒常、持久、长期主义","亨，无咎，利贞，利有攸往。","雷风，恒；君子以立不易方。","选择一个能长期重复的节奏，坚持比爆发更重要。","固执与恒心不同，周期性复盘才能保持方向。","坚持,长期,节奏"],
  [33,"天山遯","Dun","乾","艮","退避、留白、保存实力","亨，小利贞。","天下有山，遯；君子以远小人，不恶而严。","有意识地退出不值得的消耗，保存选择权。","退让不是逃避，明确何时再出场。","退避,边界,留白"],
  [34,"雷天大壮","Da Zhuang","震","乾","强盛、力量、正大","利贞。","雷在天上，大壮；君子以非礼弗履。","力量上升时更要守住分寸，做正确而非逞强的事。","冲动会把优势变成冲突，先确认对方承受度。","力量,分寸,推进"],
  [35,"火地晋","Jin","离","坤","进展、被看见、上升","康侯用锡马蕃庶，昼日三接。","明出地上，晋；君子以自昭明德。","让成果被看见，主动争取正当的反馈与资源。","上升期别急于求成，守住质量和节奏。","进展,认可,上升"],
  [36,"地火明夷","Ming Yi","坤","离","光明受伤、韬光养晦","利艰贞。","明入地中，明夷；君子以莅众，用晦而明。","环境不利时先保护核心判断，低调积蓄。","不是所有真话都要立刻说，选择安全的表达时机。","低谷,保护,韬光"],
  [37,"风火家人","Jia Ren","巽","离","家庭、秩序、角色","利女贞。","风自火出，家人；君子以言有物而行有恒。","从身边的关系和日常秩序入手，明确分工。","过度控制会破坏亲密，规则要配合温度。","家庭,秩序,分工"],
  [38,"火泽睽","Kui","离","兑","背离、差异、求同存异","小事吉。","上火下泽，睽；君子以同而异。","承认差异，从小的共同目标开始协作。","试图一次说服所有人，会错过可行的交集。","分歧,差异,协商"],
  [39,"水山蹇","Jian","坎","艮","艰难、止步、求助","利西南，不利东北；利见大人，贞吉。","山上有水，蹇；君子以反身修德。","绕开最陡的路，回看自身并寻找有经验的帮助。","别在阻力最大处证明意志，换路径也是前进。","阻滞,求助,转向"],
  [40,"雷水解","Jie","震","坎","解困、松绑、释放","利西南，无所往，其来复吉。有攸往，夙吉。","雷雨作，解；君子以赦过宥罪。","及时把问题说开并处理，给自己和他人减压。","解决之后要清理余波，别让旧模式复发。","解困,释放,复盘"],
  [41,"山泽损","Sun","艮","兑","减损、节制、换取长期","有孚，元吉，无咎，可贞，利有攸往。","山下有泽，损；君子以惩忿窒欲。","主动减掉低价值事项，把资源投向核心。","舍不得沉没成本，会继续拖住你。","减法,聚焦,节制"],
  [42,"风雷益","Yi","巽","震","增益、互惠、投入","利有攸往，利涉大川。","风雷，益；君子以见善则迁，有过则改。","把新增资源用在能产生复利的地方，也允许自己修正。","得到支持后要回馈，单向索取无法持续。","增长,投入,互惠"],
  [43,"泽天夬","Guai","兑","乾","决断、公告、去除","扬于王庭，孚号有厉。告自邑，不利即戎，利有攸往。","泽上于天，夬；君子以施禄及下。","把底线和决定说清楚，用公开而克制的方式推进。","决断不等于攻击，避免把局面推向不可逆。","决断,公开,边界"],
  [44,"天风姤","Gou","乾","巽","相遇、突发诱因、警觉","女壮，勿用取女。","天下有风，姤；后以施命诰四方。","新机会或新关系出现时，先观察动机与长期影响。","短期吸引力强，不代表适合立刻绑定。","相遇,机会,警觉"],
  [45,"泽地萃","Cui","兑","坤","聚集、汇合、共识","亨。王假有庙，利见大人，亨。","泽上于地，萃；君子以除戎器，戒不虞。","借助群体与仪式感聚拢资源，明确共同目标。","人多并不自动高效，要提前设定秩序和预案。","聚集,共识,组织"],
  [46,"地风升","Sheng","坤","巽","上升、渐进、积小成大","元亨，用见大人，勿恤，南征吉。","地中生木，升；君子以顺德，积小以高大。","沿着可重复的路径一点点上升，主动找贵人校准。","不要因为起点低而自我否定，稳步比跳跃可靠。","成长,积累,晋升"],
  [47,"泽水困","Kun","兑","坎","困顿、受限、守志","亨，贞，大人吉，无咎，有言不信。","泽无水，困；君子以致命遂志。","先承认资源有限，守住最重要的承诺。","解释太多不如行动，等待环境给出证据。","困境,守志,资源"],
  [48,"水风井","Jing","坎","巽","井养、公共资源、基础","改邑不改井，无丧无得，往来井井。","木上有水，井；君子以劳民劝相。","把基础设施和长期供给做好，让别人也能受益。","只顾打水不修井，短期有效也会慢慢枯竭。","基础,供给,长期"],
  [49,"泽火革","Ge","兑","离","变革、更新、脱旧","巳日乃孚，元亨利贞，悔亡。","泽中有火，革；君子以治历明时。","先取得信任和时机，再推动必要的结构变化。","改革要有过渡方案，别只表达不满。","变革,更新,时机"],
  [50,"火风鼎","Ding","离","巽","鼎新、养成、承载成果","元吉，亨。","木上有火，鼎；君子以正位凝命。","把资源烹调成真正有价值的成果，建立新秩序。","新架构要有人维护，别只追求漂亮的开始。","成果,重建,秩序"],
  [51,"震为雷","Zhen","震","震","震动、觉醒、突发","亨。震来虩虩，笑言哑哑。","洊雷，震；君子以恐惧修省。","变化来时先稳住身体和判断，再抓住新的动力。","惊慌会扩大损失，给自己留出反应时间。","变化,觉醒,应变"],
  [52,"艮为山","Gen","艮","艮","止、静定、边界","艮其背，不获其身；行其庭，不见其人，无咎。","兼山，艮；君子以思不出其位。","在该停的地方停下，把注意力收回当下。","停止不等于拖延，明确下一次启动条件。","停止,专注,边界"],
  [53,"风山渐","Jian","巽","艮","渐进、循序、成熟","女归吉，利贞。","山上有木，渐；君子以居贤德善俗。","接受成长需要时间，用阶段性承诺换取稳定。","不要被比较催快，未成熟的速度会带来返工。","渐进,成熟,承诺"],
  [54,"雷泽归妹","Gui Mei","震","兑","位置不正、临时关系","征凶，无攸利。","泽上有雷，归妹；君子以永终知敝。","先确认自己在关系或计划中的真实位置。","不要因为急于得到结果而接受失衡的条件。","位置,关系,谨慎"],
  [55,"雷火丰","Feng","震","离","丰盛、盛大、短暂高峰","亨，王假之，勿忧，宜日中。","雷电皆至，丰；君子以折狱致刑。","在高光时刻把成果定型，及时完成关键决策。","盛极会衰，别把曝光当成永久安全。","高峰,决策,盛极"],
  [56,"火山旅","Lu","离","艮","行旅、暂居、保持轻装","小亨，旅贞吉。","山上有火，旅；君子以明慎用刑，而不留狱。","把自己当作过客，轻装、守礼、快速学习。","不要在临时环境投入过多沉没成本。","迁移,适应,轻装"],
  [57,"巽为风","Xun","巽","巽","深入、渗透、谦顺","小亨，利有攸往，利见大人。","随风，巽；君子以申命行事。","用持续而细小的影响改变局面，重复清晰的沟通。","过度犹豫会失去方向，柔软也要有原则。","沟通,渗透,原则"],
  [58,"兑为泽","Dui","兑","兑","喜悦、交流、兑现","亨，利贞。","丽泽，兑；君子以朋友讲习。","坦诚交流、分享知识，让关系在轻松中变深。","只追求取悦会稀释真实意见，保留诚实。","交流,喜悦,反馈"],
  [59,"风水涣","Huan","巽","坎","涣散、疏解、重新聚心","亨。王假有庙，利涉大川，利贞。","风行水上，涣；先王以享于帝立庙。","先疏通情绪与阻塞，再把人心聚回共同目标。","分散状态下不要强行加码，先恢复连接。","疏通,重聚,情绪"],
  [60,"水泽节","Jie","坎","兑","节制、界限、可持续","亨。苦节不可贞。","泽上有水，节；君子以制数度，议德行。","设置能长期遵守的规则和预算，保留弹性。","过度压抑会反弹，节制要有尺度与余地。","规则,预算,尺度"],
  [61,"风泽中孚","Zhong Fu","巽","兑","诚信、内在信任、共鸣","豚鱼吉，利涉大川，利贞。","泽上有风，中孚；君子以议狱缓死。","用真诚和可验证的行动建立深层信任。","说得漂亮不如做到，信任需要时间累积。","信任,诚实,共鸣"],
  [62,"雷山小过","Xiao Guo","震","艮","小过、谨慎、做小事","亨，利贞。可小事，不可大事。","山上有雷，小过；君子以行过乎恭，丧过乎哀。","把目标缩小、把动作做细，先完成眼前可控的部分。","此时不宜大开大合，耐心处理细节。","小步,细节,谨慎"],
  [63,"水火既济","Ji Ji","坎","离","已成、完成、守成","亨小，利贞，初吉终乱。","水在火上，既济；君子以思患而预防之。","事情已见成果，下一步是维护、交接与预防。","完成感会让人松懈，最要紧的是收尾。","完成,守成,预防"],
  [64,"火水未济","Wei Ji","离","坎","未成、过渡、最后一跃","亨。小狐汔济，濡其尾，无攸利。","火在水上，未济；君子以慎辨物居方。","把未完成拆成最后几步，重新校准顺序。","不要在临门一脚急躁，收尾同样需要方法。","过渡,收尾,校准"],
].map(([number,name,pinyin,upper,lower,meaning,judgment,image,action,watch,keywords]) => ({number,name,pinyin,upper,lower,meaning,judgment,image,action,watch,keywords: keywords.split(",")}));

const HEX_BY_ID = Object.fromEntries(HEX_DATA.map((hex) => [hex.number, hex]));
const HEX_BY_BITS = Object.fromEntries(HEX_DATA.map((hex) => [bitsForHex(hex), hex.number]));
const LINE_LABELS = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
const LINE_GUIDANCE = [
  "先观察环境，先做准备，不急着表态。",
  "把小事做稳，获得一个可验证的反馈。",
  "注意节奏与边界，避免在中段用力过猛。",
  "可以试探性推进，记得保留回旋空间。",
  "让核心原则做决定，不要被短期情绪带走。",
  "及时收束与复盘，把经验带回下一轮。",
];
const EXAMPLE_QUESTIONS = [
  ["接下来三个月，我该不该接受这份新工作？", "work"],
  ["这段关系接下来最需要面对的课题是什么？", "relationship"],
  ["我现在适合做出这个重要决定吗？", "decision"],
  ["最近的财务安排，最需要留意什么？", "wealth"],
  ["我该如何调整最近过快的生活节奏？", "health"],
];

let state = {
  mode: "cast",
  lines: ReadingState.createEmptyLines(),
  lastResult: null,
  history: loadHistory(),
  phase: "idle",
  isCasting: false,
  castToken: 0,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function bitsForHex(hex) {
  return `${TRIGRAMS[hex.lower].bits}${TRIGRAMS[hex.upper].bits}`;
}

function bitsToId(lines) {
  return HEX_BY_BITS[lines.map((line) => line.value).join("")];
}

function changedLines(lines) {
  return lines.map((line) => (line.moving ? { ...line, value: line.value ? 0 : 1 } : { ...line }));
}

function buildHexSymbol(lines, className = "") {
  return `<div class="hex-symbol ${className}">${[...lines].reverse().map((line) => `<span class="line-graphic" aria-hidden="true"><span class="${line.value ? "yang-line" : "yin-line"}"></span>${line.value ? "" : "<span class=\"yin-line\"></span>"}</span>`).join("")}</div>`;
}

function renderBoard() {
  const board = $("#lines-board");
  const editable = ReadingState.isBoardEditable({ method: getMethod(), phase: state.phase, hasResult: Boolean(state.lastResult), isCasting: state.isCasting });
  board.innerHTML = state.lines.map((line, index) => {
    const valueName = line.value ? "阳爻" : "阴爻";
    const disabled = editable ? "" : " disabled";
    return `<div class="line-cell ${line.moving ? "is-changing" : ""} ${editable ? "" : "is-locked"}" data-line="${index}">
      <div class="line-index"><span>${LINE_LABELS[index]}</span><strong>${valueName}</strong></div>
      <button class="line-graphic line-value-toggle" type="button" aria-label="切换${LINE_LABELS[index]}为${line.value ? "阴爻" : "阳爻"}" title="${editable ? "点击切换阴阳" : "切换到手动排爻后可编辑"}"${disabled}><span class="${line.value ? "yang-line" : "yin-line"}"></span>${line.value ? "" : "<span class=\"yin-line\"></span>"}</button>
      <button class="line-toggle" type="button" aria-pressed="${line.moving}" title="${editable ? "标记动爻" : "切换到手动排爻后可编辑"}"${disabled}>${line.moving ? "已标记动爻" : "标为动爻"}</button>
    </div>`;
  }).join("");
  $("#line-status").textContent = ReadingState.getLineStatus(state.phase, state.lines);
}

function castCoins() {
  const results = [];
  state.lines = Array.from({ length: 6 }, () => {
    const coins = Array.from({ length: 3 }, () => (Math.random() > .5 ? 3 : 2));
    const sum = coins.reduce((total, coin) => total + coin, 0);
    results.push(coins);
    return { value: sum === 7 || sum === 9 ? 1 : 0, moving: sum === 6 || sum === 9, raw: sum };
  });
  $("#coin-tray").hidden = false;
  $("#coin-results").innerHTML = results.map((coins) => `<span class="coin-set">${coins.map((coin) => `<span class="coin">${coin === 3 ? "陽" : "陰"}</span>`).join("")}</span>`).join("");
}

function castQuick() {
  state.lines = Array.from({ length: 6 }, () => {
    const raw = 6 + Math.floor(Math.random() * 4);
    return { value: raw === 7 || raw === 9 ? 1 : 0, moving: raw === 6 || raw === 9, raw };
  });
  $("#coin-tray").hidden = true;
}

function resetReading({ clearQuestion = false, resetCategory = false } = {}) {
  state = ReadingState.resetReadingState(state, getMethod());
  $("#cast-button").disabled = false;
  $("#coin-tray").hidden = true;
  $("#coin-results").innerHTML = "";
  $("#result-section").hidden = true;
  $("#ai-panel").hidden = true;
  if (clearQuestion) $("#question").value = "";
  if (resetCategory) $("#category").value = "work";
  updateQuestionCount();
  renderBoard();
}

function getMethod() { return document.querySelector("input[name='casting-method']:checked")?.value || "coins"; }

function runCast() {
  if (state.isCasting) return;
  state.isCasting = true;
  const castToken = ++state.castToken;
  $("#cast-button").disabled = true;
  if (getMethod() === "coins") castCoins();
  else if (getMethod() === "quick") castQuick();
  else {
    state.lines.forEach((line) => { if (line.raw === null) line.raw = line.value ? 7 : 8; });
  }
  state.phase = "ready";
  renderBoard();
  setTimeout(() => {
    if (castToken !== state.castToken) return;
    state.phase = "rendered";
    showResult();
    state.isCasting = false;
    $("#cast-button").disabled = false;
    renderBoard();
  }, 180);
}

function showResult() {
  const id = bitsToId(state.lines);
  if (!id) return showToast("六爻组合暂未匹配，请重新起卦");
  const changed = changedLines(state.lines);
  const changedId = state.lines.some((line) => line.moving) ? bitsToId(changed) : null;
  state.lastResult = { id, changedId, lines: state.lines.map((line) => ({ ...line })), question: $("#question").value.trim() || "未填写具体问题", category: $("#category").value, timestamp: Date.now() };
  renderResult(state.lastResult);
  saveHistory(state.lastResult);
  renderHistory();
  $("#result-section").hidden = false;
  $("#result-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResult(result) {
  const hex = HEX_BY_ID[result.id];
  const lens = CATEGORY_LENS[result.category] || CATEGORY_LENS.general;
  $("#result-number").textContent = `第${hex.number}卦`;
  $("#result-changing").textContent = result.changedId ? `${result.lines.filter((line) => line.moving).length} 爻变` : "本卦";
  $("#result-symbol").innerHTML = buildHexSymbol(result.lines);
  $("#result-name").textContent = hex.name;
  $("#result-pinyin").textContent = hex.pinyin.toUpperCase();
  $("#result-upper").textContent = `${TRIGRAMS[hex.upper].symbol} ${TRIGRAMS[hex.upper].element}`;
  $("#result-lower").textContent = `${TRIGRAMS[hex.lower].symbol} ${TRIGRAMS[hex.lower].element}`;
  $("#result-summary").textContent = `${lens.prefix}${hex.meaning}。`;
  $("#result-judgment").textContent = hex.judgment;
  $("#result-image").textContent = hex.image;
  $("#result-action").textContent = `${hex.action}${hex.watch}`;
  $("#result-time").textContent = new Date(result.timestamp).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const moving = result.lines.map((line, index) => ({ ...line, index })).filter((line) => line.moving);
  $("#changing-panel").hidden = moving.length === 0;
  if (moving.length) {
    $("#changing-count").textContent = `${moving.length} 个动爻`;
    $("#changing-lines").innerHTML = moving.map((line) => `<article class="changing-item"><strong>${LINE_LABELS[line.index]} · ${line.value ? "阳转阴" : "阴转阳"}</strong><p>${LINE_GUIDANCE[line.index]}</p></article>`).join("");
    const changedHex = HEX_BY_ID[result.changedId];
    $("#changed-hexagram").innerHTML = `变卦落在 <span>第${changedHex.number}卦 · ${changedHex.name}</span>：${changedHex.meaning}。${changedHex.action}`;
  }
  $("#ai-panel").hidden = true;
  $("#ai-output").textContent = "";
  $("#ai-status").textContent = "等待调用";
  $("#qwen-button").disabled = false;
}

function renderLookup() {
  const query = $("#hex-search").value.trim().toLowerCase();
  const filter = $("#lookup-filter").value;
  const items = HEX_DATA.filter((hex) => {
    const inFilter = filter === "all" || (filter === "early" && hex.number <= 16) || (filter === "middle" && hex.number > 16 && hex.number <= 48) || (filter === "late" && hex.number > 48);
    const haystack = `${hex.number} ${hex.name} ${hex.pinyin} ${hex.meaning} ${hex.keywords.join(" ")}`.toLowerCase();
    return inFilter && (!query || haystack.includes(query));
  });
  $("#hex-grid").innerHTML = items.length ? items.map((hex) => `<button class="hex-tile ${state.lookupId === hex.number ? "is-active" : ""}" data-hex-id="${hex.number}" type="button"><strong>${String(hex.number).padStart(2, "0")}</strong><span>${hex.name.replace(/为|雷|水|火|风|泽|山|地|天/g, "")}</span><small>${hex.pinyin}</small></button>`).join("") : `<p class="empty-history">没有找到相符的卦象。</p>`;
}

function showLookupDetail(id) {
  const hex = HEX_BY_ID[id];
  if (!hex) return;
  state.lookupId = id;
  const lines = bitsForHex(hex).split("").map((value) => ({ value: Number(value), moving: false }));
  $("#lookup-detail").hidden = false;
  $("#lookup-detail").innerHTML = `<div class="hexagram-card"><span class="section-kicker">第${hex.number}卦</span>${buildHexSymbol(lines)}<h3>${hex.name}</h3><p class="result-pinyin">${hex.pinyin.toUpperCase()}</p></div><div class="lookup-detail-copy"><span class="mini-label">${hex.keywords.join(" · ")}</span><p><strong>卦义：</strong>${hex.meaning}。</p><p><strong>卦辞：</strong>${hex.judgment}</p><p><strong>行动：</strong>${hex.action}${hex.watch}</p></div>`;
  renderLookup();
  $("#lookup-detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setMode(mode) {
  state.mode = mode;
  $$(".mode-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
  $("#cast-panel").hidden = mode !== "cast";
  $("#result-section").hidden = mode !== "cast" || !state.lastResult;
  $("#lookup-panel").hidden = mode !== "lookup";
  if (mode === "lookup") renderLookup();
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem("guanxiang-history") || "[]"); } catch { return []; }
}

function saveHistory(result) {
  state.history = [result, ...state.history.filter((item) => item.timestamp !== result.timestamp)].slice(0, 6);
  localStorage.setItem("guanxiang-history", JSON.stringify(state.history));
}

function renderHistory() {
  const list = $("#history-list");
  if (!state.history.length) { list.innerHTML = `<p class="empty-history">还没有记录。每一次提问，都会留下一个可回看的切面。</p>`; return; }
  list.innerHTML = state.history.map((item, index) => {
    const hex = HEX_BY_ID[item.id];
    return `<div class="history-item"><time>${new Date(item.timestamp).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</time><div><strong>第${hex.number}卦 · ${hex.name}</strong><p>${item.question}</p></div><button type="button" data-history-index="${index}">查看解读 ↗</button></div>`;
  }).join("");
}

function restoreHistory(index) {
  const item = state.history[index];
  if (!item) return;
  state.lastResult = item;
  state.lines = item.lines.map((line) => ({ ...line }));
  state.phase = "rendered";
  state.isCasting = false;
  $("#question").value = item.question === "未填写具体问题" ? "" : item.question;
  $("#category").value = item.category || "general";
  updateQuestionCount();
  renderBoard();
  renderResult(item);
  setMode("cast");
  $("#result-section").hidden = false;
  $("#result-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateQuestionCount() { $("#question-count").textContent = `${$("#question").value.length} / 120`; }

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function resultText(result) {
  const hex = HEX_BY_ID[result.id];
  const changed = result.changedId ? HEX_BY_ID[result.changedId] : null;
  return [`观象 · 周易解卦`, `问题：${result.question}`, `本卦：第${hex.number}卦 ${hex.name}`, `卦义：${hex.meaning}`, `卦辞：${hex.judgment}`, `象曰：${hex.image}`, `行动提示：${hex.action}${hex.watch}`, changed ? `变卦：第${changed.number}卦 ${changed.name} · ${changed.meaning}` : ""].filter(Boolean).join("\n");
}

async function copyResult() {
  if (!state.lastResult) return;
  try { await navigator.clipboard.writeText(resultText(state.lastResult)); showToast("解读已复制"); }
  catch { showToast("当前浏览器不允许复制，请手动选择文本"); }
}

async function requestQwenReading() {
  const result = state.lastResult;
  if (!result) return;
  const primary = HEX_BY_ID[result.id];
  const changed = result.changedId ? HEX_BY_ID[result.changedId] : null;
  const movingLines = result.lines.map((line, index) => ({ position: LINE_LABELS[index], yinYang: line.value ? "阳" : "阴", moving: line.moving })).filter((line) => line.moving);
  const button = $("#qwen-button");
  const panel = $("#ai-panel");
  const output = $("#ai-output");
  const status = $("#ai-status");
  button.disabled = true;
  panel.hidden = false;
  status.textContent = "正在请求本地模型";
  output.textContent = "Qwen 正在阅读这组卦象……";
  try {
    const response = await fetch("/api/qwen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: result.question,
        category: CATEGORY_LENS[result.category]?.label || "综合",
        primaryHex: { number: primary.number, name: primary.name, meaning: primary.meaning, judgment: primary.judgment, image: primary.image, action: primary.action, watch: primary.watch },
        movingLines,
        changedHex: changed ? { number: changed.number, name: changed.name, meaning: changed.meaning, action: changed.action, watch: changed.watch } : null,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `本地模型请求失败（${response.status}）`);
    output.textContent = typeof data.text === "string" ? data.text.trim() : "模型没有返回可显示的文字。";
    status.textContent = `已完成 · ${data.model || "Qwen"}`;
  } catch (error) {
    output.textContent = "暂时无法连接本地 Qwen。请确认本地模型服务已启动，并用 node server.js 启动这个页面。";
    status.textContent = "连接失败";
    showToast(error.message || "本地模型连接失败");
  } finally {
    button.disabled = false;
  }
}

function bindEvents() {
  $$(".mode-tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
  $("#question").addEventListener("input", updateQuestionCount);
  $("#cast-button").addEventListener("click", runCast);
  $("#new-reading").addEventListener("click", () => { resetReading({ clearQuestion: true, resetCategory: true }); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("#copy-result").addEventListener("click", copyResult);
  $("#qwen-button").addEventListener("click", requestQwenReading);
  $("#hex-search").addEventListener("input", renderLookup);
  $("#lookup-filter").addEventListener("change", renderLookup);
  $("#clear-history").addEventListener("click", () => { state.history = []; localStorage.removeItem("guanxiang-history"); renderHistory(); showToast("记录已清空"); });
  $("#random-question").addEventListener("click", () => { const [question, category] = EXAMPLE_QUESTIONS[Math.floor(Math.random() * EXAMPLE_QUESTIONS.length)]; $("#question").value = question; $("#category").value = category; updateQuestionCount(); });
  $$('input[name="casting-method"]').forEach((input) => input.addEventListener("change", () => { $$(".method-card").forEach((card) => card.classList.toggle("is-selected", card.querySelector("input").checked)); resetReading(); }));
  $("#lines-board").addEventListener("click", (event) => { const cell = event.target.closest(".line-cell"); if (!cell || !ReadingState.isBoardEditable({ method: getMethod(), phase: state.phase, hasResult: Boolean(state.lastResult), isCasting: state.isCasting })) return; const index = Number(cell.dataset.line); if (event.target.closest(".line-value-toggle")) state.lines[index].value = state.lines[index].value ? 0 : 1; if (event.target.closest(".line-toggle")) state.lines[index].moving = !state.lines[index].moving; renderBoard(); });
  $("#hex-grid").addEventListener("click", (event) => { const tile = event.target.closest("[data-hex-id]"); if (tile) showLookupDetail(Number(tile.dataset.hexId)); });
  $("#history-list").addEventListener("click", (event) => { const button = event.target.closest("[data-history-index]"); if (button) restoreHistory(Number(button.dataset.historyIndex)); });
}

renderBoard();
renderHistory();
bindEvents();
