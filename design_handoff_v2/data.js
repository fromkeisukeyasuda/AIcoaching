// Shared content lifted directly from the AIcoaching repo so all four
// direction mockups render real Japanese copy, not lorem ipsum.

window.AIC_DATA = {
  scenarios: [
    {
      id: "team-management",
      title: "チームマネジメント",
      clientName: "田中 誠",
      clientRole: "チームリーダー（30代）",
      situation:
        "3ヶ月前にマネージャーに昇進したが、チームの生産性が上がらず悩んでいる。メンバーとのコミュニケーションにも課題を感じている。",
      emotion:
        "不安と焦りを感じているが、チームをよりよくしたいという強い気持ちもある。",
      description:
        "昇進したばかりのマネージャーがチームのパフォーマンス向上に悩んでいます。",
      tags: ["マネジメント", "リーダーシップ", "チームビルディング"],
    },
    {
      id: "career-change",
      title: "キャリア転換",
      clientName: "佐藤 美咲",
      clientRole: "会社員（28歳）",
      situation:
        "現職に5年勤めているが、やりがいを感じられなくなってきた。転職か独立かで迷っており、次のキャリアをどう描くべきか悩んでいる。",
      emotion:
        "現状への不満と変化への不安が混在している。新しいことに挑戦したい気持ちもある。",
      description:
        "キャリアの岐路に立ち、次のステップを模索しているビジネスパーソンです。",
      tags: ["キャリア", "転職", "自己実現"],
    },
    {
      id: "work-life-balance",
      title: "ワーク・ライフバランス",
      clientName: "鈴木 健一",
      clientRole: "ビジネスパーソン（35歳）",
      situation:
        "仕事が忙しすぎて家族との時間が取れず、健康面も心配になってきた。残業が常態化しており、このままでいいのか悩んでいる。",
      emotion:
        "疲弊感と罪悪感を感じている。仕事も家族も大切にしたいが、どうすればいいかわからない。",
      description: "仕事と私生活のバランスを取ることに苦労している人です。",
      tags: ["ワークライフバランス", "家族", "健康管理"],
    },
  ],

  // A sample mid-session transcript from the team-management scenario.
  sessionMessages: [
    {
      role: "assistant",
      content:
        "今日はお時間いただいてありがとうございます。最近、チームの生産性のことで頭がいっぱいで…正直、何から話したらいいのか。",
    },
    {
      role: "user",
      content:
        "こちらこそありがとうございます。「頭がいっぱい」と表現されましたね。今いちばん気になっているのは、どんなことですか？",
    },
    {
      role: "assistant",
      content:
        "そうですね…一番は、メンバーが受け身に見えることです。会議でも意見が出ないし、自分が指示しないと進まない感覚があって。",
    },
    {
      role: "user",
      content:
        "なるほど。「指示しないと進まない感覚」をもう少し聞かせてください。具体的にはどんな場面で感じますか？",
    },
    {
      role: "assistant",
      content:
        "週次の進捗ミーティングです。詰まっていることを聞いても、誰も口を開かなくて。気まずい空気のまま、結局私が穴埋めしてしまうんです。",
    },
  ],

  // Sample evaluation result.
  evaluation: {
    overallScore: 78,
    summary:
      "傾聴と承認の質が高く、クライアントの言葉を丁寧に拾い上げています。一方で、視点を広げる問いかけにもう一歩踏み込めると、気づきの深さが増すでしょう。",
    scores: [
      { category: "傾聴力", score: 17, max: 20, color: "high" },
      { category: "質問力", score: 14, max: 20, color: "mid" },
      { category: "共感力", score: 18, max: 20, color: "high" },
      { category: "中立性", score: 16, max: 20, color: "high" },
      { category: "目標設定", score: 13, max: 20, color: "low" },
    ],
    strengths: [
      "クライアントの言葉を丁寧に繰り返し、承認を積み重ねていた",
      "感情のラベリングが的確で、安心して話せる場をつくれていた",
      "オープン質問で具体的な場面を引き出せていた",
    ],
    improvements: [
      "「なぜ」より「何が」「どのように」で原因と行動を分けて聞く",
      "中盤以降、視点を未来や第三者にずらす問いを増やす",
      "セッション終盤のゴール再確認に時間を割く",
    ],
    nextSteps:
      "次回は、最初の10分で「今日のセッションで持ち帰りたいこと」を一緒に言語化してから本題に入ってみてください。",
    review: [
      { item: "沈黙を待つ姿勢", addressed: true, comment: "前回より明らかに沈黙を許容できていました。" },
      { item: "問いの粒度を揃える", addressed: false, comment: "後半でやや抽象的な問いに戻る場面がありました。" },
    ],
  },
};
