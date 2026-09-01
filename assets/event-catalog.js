(function () {
  'use strict';

  const events = [
    { id:'EV-001', title:'朝の路地裏フォトウォーク', mood:'rest', stimulus:'place', unknown:'safe', offset:3, time:'09:00:00', location:'架空会場：月影通り入口', hint:'スマートフォン片手に、いつも見落とす景色を探します。', dress:'歩きやすい靴', budget:0, description:'小さな路地を歩きながら、気になった光や看板を5枚だけ撮る静かな街歩きです。' },
    { id:'EV-002', title:'知らない喫茶店で一冊交換', mood:'rest', stimulus:'people', unknown:'mid', offset:4, time:'14:00:00', location:'架空会場：喫茶アンダーライン', hint:'読み終えた本を一冊だけ持ってきてください。', dress:'普段着', budget:1200, description:'少人数で本を紹介し合い、その場で一冊を交換する短い対話イベントです。' },
    { id:'EV-003', title:'はじめての手びねり陶芸', mood:'active', stimulus:'experience', unknown:'safe', offset:5, time:'13:00:00', location:'架空会場：白土スタジオ', hint:'形に正解はありません。手を動かすだけで完成します。', dress:'汚れてもよい服', budget:3500, description:'粘土から小さな器を一つ作ります。初心者向けで、道具と材料は会場に用意されています。' },
    { id:'EV-004', title:'夕暮れの音だけ散歩', mood:'rest', stimulus:'place', unknown:'mid', offset:6, time:'17:30:00', location:'架空会場：水鏡公園', hint:'会話を止めて、街の音を採集します。', dress:'体温調整しやすい服', budget:0, description:'夕暮れの公園と周辺を歩き、聞こえた音を短い言葉で記録するサウンドウォークです。' },
    { id:'EV-005', title:'三人だけのボードゲーム卓', mood:'active', stimulus:'people', unknown:'safe', offset:7, time:'18:30:00', location:'架空会場：PLAYROOM 404', hint:'ルールは当日説明します。予習不要です。', dress:'普段着', budget:1500, description:'初対面の参加者三人で、会話が自然に生まれる短時間ゲームを二つ遊びます。' },
    { id:'EV-006', title:'香りをつくる小さな実験室', mood:'rest', stimulus:'experience', unknown:'safe', offset:8, time:'11:00:00', location:'架空会場：SCENT LAB', hint:'好きな香りが分からなくても大丈夫です。', dress:'香水をつけずに参加', budget:2800, description:'数種類の香りを試し、自分だけの小さなルームミストを調合します。' },
    { id:'EV-007', title:'行き先を決めない路線バス', mood:'active', stimulus:'place', unknown:'high', offset:9, time:'10:00:00', location:'架空会場：中央バスターミナル', hint:'最初に来たバスへ乗り、気になった停留所で降ります。', dress:'歩きやすい服', budget:1800, description:'ガイドと一緒に偶然の停留所を選び、周辺を一時間だけ探索するミニトリップです。' },
    { id:'EV-008', title:'10分だけの他己紹介', mood:'active', stimulus:'people', unknown:'mid', offset:10, time:'19:00:00', location:'架空会場：ROOM NINE', hint:'話すテーマはこちらで用意します。', dress:'普段着', budget:800, description:'二人一組で短く話し、相手の魅力を代わりに紹介するコミュニケーション体験です。' },
    { id:'EV-009', title:'夜のはじめてスケッチ', mood:'rest', stimulus:'experience', unknown:'mid', offset:11, time:'19:30:00', location:'架空会場：灯台アトリエ', hint:'絵が苦手な人向けの会です。', dress:'袖をまくれる服', budget:2200, description:'暗い室内で一つのモチーフを眺め、線だけで描く初心者向けスケッチ会です。' },
    { id:'EV-010', title:'朝市で500円の宝探し', mood:'active', stimulus:'place', unknown:'safe', offset:12, time:'08:30:00', location:'架空会場：青空朝市', hint:'予算内で一番気になるものを一つ選びます。', dress:'歩きやすい服', budget:500, description:'架空の朝市を巡り、普段なら選ばない小さな品を一つ見つける探索イベントです。' },
    { id:'EV-011', title:'無言の共同パズル', mood:'rest', stimulus:'people', unknown:'high', offset:13, time:'15:00:00', location:'架空会場：SILENT ROOM', hint:'言葉を使わず、身振りだけで協力します。', dress:'普段着', budget:1000, description:'初対面の四人が会話をせずに一つの立体パズルを完成させる協働体験です。' },
    { id:'EV-012', title:'スパイスから作るチャイ', mood:'rest', stimulus:'experience', unknown:'safe', offset:14, time:'14:00:00', location:'架空会場：台所ミモザ', hint:'香りを選ぶだけで、自分好みに仕上がります。', dress:'袖をまくれる服', budget:1800, description:'三種類のスパイスを選び、鍋で煮出して一杯のオリジナルチャイを作ります。' },
    { id:'EV-013', title:'知らない駅の一駅手前', mood:'active', stimulus:'place', unknown:'mid', offset:15, time:'12:00:00', location:'架空会場：環状線北口', hint:'目的地の一駅手前で降りるだけの旅です。', dress:'歩きやすい靴', budget:1400, description:'指定された架空路線に乗り、一駅手前で降りて昼食場所を探す半日の街歩きです。' },
    { id:'EV-014', title:'質問カードの晩餐会', mood:'rest', stimulus:'people', unknown:'mid', offset:16, time:'18:00:00', location:'架空会場：TABLE 12', hint:'会話のきっかけはカードが用意します。', dress:'少しだけお気に入りの服', budget:3200, description:'少人数の食卓で質問カードを一枚ずつ引き、普段はしない話を楽しむ夕食会です。' },
    { id:'EV-015', title:'一曲だけのDJ体験', mood:'active', stimulus:'experience', unknown:'high', offset:17, time:'20:00:00', location:'架空会場：BASEMENT B', hint:'好きな一曲だけ選んでください。', dress:'動きやすい服', budget:2500, description:'機材の基本操作を教わり、自分で選んだ一曲を会場で流す超初心者向け体験です。' },
    { id:'EV-016', title:'屋上で雲を読む朝', mood:'rest', stimulus:'place', unknown:'safe', offset:18, time:'07:30:00', location:'架空会場：東棟ルーフトップ', hint:'温かい飲み物はこちらで用意します。', dress:'防寒できる服', budget:700, description:'屋上で空を眺め、雲の形から一日の物語を考える静かな朝の会です。' },
    { id:'EV-017', title:'一日店員の30分', mood:'active', stimulus:'people', unknown:'high', offset:19, time:'16:00:00', location:'架空会場：雑貨店ポケット', hint:'接客台本があるので緊張しても大丈夫です。', dress:'清潔感のある普段着', budget:0, description:'架空の雑貨店で30分だけ店員役を体験し、来場者へおすすめを一つ紹介します。' },
    { id:'EV-018', title:'植物の名前を知らない観察会', mood:'rest', stimulus:'experience', unknown:'safe', offset:20, time:'10:30:00', location:'架空会場：緑陰テラス', hint:'名前を調べず、形や色だけを観察します。', dress:'屋外向けの服', budget:600, description:'植物の知識を使わず、葉の形や手触りを自分の言葉で記録する観察会です。' },
    { id:'EV-019', title:'地図を逆さに持つ街歩き', mood:'active', stimulus:'place', unknown:'high', offset:21, time:'13:30:00', location:'架空会場：西門広場', hint:'迷うこと自体を楽しむ短いルートです。', dress:'歩きやすい服', budget:0, description:'安全な範囲で地図を逆さに読み、普段とは違う角度から街を歩くガイド付き企画です。' },
    { id:'EV-020', title:'名前を伏せた作品交換会', mood:'rest', stimulus:'people', unknown:'high', offset:22, time:'17:00:00', location:'架空会場：WHITE BOX', hint:'小さな文章か写真を一つ用意します。', dress:'普段着', budget:900, description:'作者名を伏せた短い作品を交換し、受け取った印象だけを伝え合う会です。' },
    { id:'EV-021', title:'金継ぎ風アクセサリーづくり', mood:'rest', stimulus:'experience', unknown:'mid', offset:23, time:'13:00:00', location:'架空会場：修復室つぎめ', hint:'壊れたものは持参不要です。', dress:'汚れてもよい服', budget:3000, description:'割れ模様のパーツを組み合わせ、金継ぎの考え方を取り入れたアクセサリーを作ります。' },
    { id:'EV-022', title:'始発前の静かな駅前', mood:'rest', stimulus:'place', unknown:'high', offset:24, time:'05:30:00', location:'架空会場：零番駅前', hint:'早起きした人だけが見られる景色を歩きます。', dress:'防寒と歩きやすい靴', budget:0, description:'ガイドと駅前を短く歩き、街が動き始める瞬間を観察する早朝イベントです。' },
    { id:'EV-023', title:'初対面で一枚の新聞づくり', mood:'active', stimulus:'people', unknown:'mid', offset:25, time:'14:30:00', location:'架空会場：EDIT ROOM', hint:'取材テーマとテンプレートは用意されています。', dress:'普段着', budget:1300, description:'四人で短い取材を行い、A3一枚の架空新聞を完成させる共同制作です。' },
    { id:'EV-024', title:'音の鳴るものを作る午後', mood:'active', stimulus:'experience', unknown:'safe', offset:26, time:'15:00:00', location:'架空会場：工作室ノイズ', hint:'楽器経験は不要です。', dress:'作業しやすい服', budget:2400, description:'身近な素材を組み合わせ、小さな音の出る道具を一つ作って鳴らします。' },
    { id:'EV-025', title:'橋を三つ渡るだけの旅', mood:'active', stimulus:'place', unknown:'mid', offset:27, time:'11:00:00', location:'架空会場：第一水門', hint:'ゴールは三つ目の橋を渡ることだけです。', dress:'長時間歩ける靴', budget:800, description:'川沿いの安全なルートで三つの橋を渡り、それぞれの景色の違いを楽しみます。' },
    { id:'EV-026', title:'知らない仕事の5分講座', mood:'rest', stimulus:'people', unknown:'safe', offset:28, time:'19:00:00', location:'架空会場：COMMON HALL', hint:'聞くだけの参加でも大丈夫です。', dress:'普段着', budget:500, description:'参加者が自分の仕事を五分だけ紹介し、普段触れない職業を知るライトな交流会です。' },
    { id:'EV-027', title:'暗闇で触る素材図鑑', mood:'rest', stimulus:'experience', unknown:'high', offset:29, time:'18:30:00', location:'架空会場：DARK LAB', hint:'安全な素材だけを使用します。', dress:'アクセサリーを外しやすい服', budget:1600, description:'目を閉じて複数の素材に触れ、手触りだけで特徴を言葉にする感覚体験です。' },
    { id:'EV-028', title:'夕方から始める小さな遠回り', mood:'active', stimulus:'place', unknown:'safe', offset:30, time:'16:30:00', location:'架空会場：南口時計台', hint:'いつもの帰り道を一時間だけ変えます。', dress:'歩きやすい服', budget:700, description:'ガイドが選んだ安全な遠回りルートを歩き、途中で一つだけ寄り道をします。' },
    { id:'EV-029', title:'褒め言葉を集める交換所', mood:'active', stimulus:'people', unknown:'safe', offset:31, time:'13:00:00', location:'架空会場：GOOD WORDS STAND', hint:'相手の良いところを一つ見つけるだけです。', dress:'普段着', budget:0, description:'短い共同作業を通して見つけた長所をカードに書き、最後に交換する交流イベントです。' },
    { id:'EV-030', title:'一分映画を撮るチーム', mood:'active', stimulus:'experience', unknown:'high', offset:32, time:'12:30:00', location:'架空会場：FRAME GARAGE', hint:'スマートフォン一台で撮影します。', dress:'動きやすい服', budget:2000, description:'三人チームで台本を選び、撮影と編集を分担して一分の短編映像を完成させます。' }
  ];

  const publicGuidance = {
    'EV-001': ['街歩き・観察', '歩きやすい靴で参加してください'],
    'EV-002': ['本・対話', '読み終えた本を1冊持参してください'],
    'EV-003': ['ものづくり・創作', '汚れてもよい服装で参加してください'],
    'EV-004': ['街歩き・感覚', '体温調整しやすい服装がおすすめです'],
    'EV-005': ['ゲーム・交流', '予習や経験は必要ありません'],
    'EV-006': ['香り・ものづくり', '当日は香水をつけずに参加してください'],
    'EV-007': ['小さな旅・探索', '歩きやすい靴と交通費をご用意ください'],
    'EV-008': ['対話・交流', '話す内容は会場で案内します'],
    'EV-009': ['絵・創作', '袖をまくれる服装で参加してください'],
    'EV-010': ['買い物・探索', '歩きやすい靴がおすすめです'],
    'EV-011': ['協力・ゲーム', '会話をしない時間があります'],
    'EV-012': ['飲み物・ものづくり', '袖をまくれる服装で参加してください'],
    'EV-013': ['街歩き・探索', '歩きやすい靴と交通費をご用意ください'],
    'EV-014': ['食事・対話', '食物アレルギーは事前に申告してください'],
    'EV-015': ['音楽・操作体験', '好きな曲を1曲だけ考えてきてください'],
    'EV-016': ['空・観察', '防寒できる服装で参加してください'],
    'EV-017': ['仕事・交流', '清潔感のある普段着で参加してください'],
    'EV-018': ['自然・観察', '屋外を歩ける服装がおすすめです'],
    'EV-019': ['街歩き・探索', '歩きやすい靴で参加してください'],
    'EV-020': ['作品・交流', '短い文章か写真を1つ持参してください'],
    'EV-021': ['ものづくり・創作', '汚れてもよい服装で参加してください'],
    'EV-022': ['早朝・街歩き', '防寒着と歩きやすい靴をご用意ください'],
    'EV-023': ['共同制作・対話', '筆記用具はこちらで用意します'],
    'EV-024': ['音・ものづくり', '作業しやすい服装で参加してください'],
    'EV-025': ['街歩き・探索', '長時間歩ける靴で参加してください'],
    'EV-026': ['仕事・対話', '聞くだけの参加でも問題ありません'],
    'EV-027': ['感覚・実験', '外しやすいアクセサリーは事前に外してください'],
    'EV-028': ['街歩き・探索', '歩きやすい服装で参加してください'],
    'EV-029': ['交流・言葉', '特別な持ち物は必要ありません'],
    'EV-030': ['映像・共同制作', '充電済みのスマートフォンを持参してください']
  };

  const durations = {
    'EV-001':120, 'EV-002':120, 'EV-003':150, 'EV-004':90,  'EV-005':120,
    'EV-006':120, 'EV-007':360, 'EV-008':60,  'EV-009':120, 'EV-010':120,
    'EV-011':90,  'EV-012':120, 'EV-013':300, 'EV-014':150, 'EV-015':120,
    'EV-016':90,  'EV-017':60,  'EV-018':120, 'EV-019':150, 'EV-020':120,
    'EV-021':150, 'EV-022':120, 'EV-023':180, 'EV-024':150, 'EV-025':300,
    'EV-026':90,  'EV-027':90,  'EV-028':120, 'EV-029':90,  'EV-030':180
  };

  window.INTO_LIFE_EVENT_CATALOG = events.map((event) => {
    const [category, notice] = publicGuidance[event.id];
    return { ...event, category, notice, duration_minutes: durations[event.id] };
  });
})();
