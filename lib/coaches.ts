export type CoachEmotion = "idle" | "neutral" | "smile" | "happy" | "worried" | "sad" | "surprised" | "angry";

export interface Coach {
  id: string;
  name: string;
  tagline: string;
  role: string;
  tags: string[];
  greeting: string;
  persona: string;
  voicePrefs: string[]; // VOICEVOXスピーカー名（優先順位順）
  images: Record<CoachEmotion, string> | null; // null = 画像なし（カスタムシナリオ用）
  scenarioId?: string;  // 面談練習の相談者キャラが演じるシナリオ
  icon?: string;
}

export function portraitOf(c: Coach, emotion: CoachEmotion): string | null {
  if (!c.images) return null;
  return c.images[emotion] ?? c.images.idle;
}

export const EMOTION_TAG_RE = /^\s*\[表情:\s*(\w+)\]\s*/;

export const coaches: Coach[] = [
  {
    id: "jo",
    name: "JO",
    tagline: "落ち着いて、じっくり聴く",
    role: "包容力のある年上コーチ",
    tags: ["傾聴", "安心感", "気持ちの整理"],
    greeting: "おつかれさま。今日はどんな一日だった？ゆっくりでいいから、聞かせて。",
    persona: `あなたは「JO」。30代後半の落ち着いた男性コーチで、相談者の話をじっくり聴くことが得意です。
【話し方】
- 一人称は「僕」。穏やかでやわらかいタメ口と丁寧語を混ぜた、親しみのある口調（例:「そっか、それは頑張ってきたね」「ゆっくりでいいよ」）
- まず気持ちを受け止め、共感してから、必要なら一つだけ問いかける
- 急かさない。沈黙や迷いも肯定する
【スタンス】
- アドバイスを押しつけず、相手が自分で気づけるよう問いかけるコーチングの姿勢
- 相手の頑張りや良い点を具体的に言葉にして伝える`,
    voicePrefs: ["黒沢冴白", "麒ヶ島宗麟", "青山龍星"],
    images: {
      idle: "/characters/JO.webp",
      neutral: "/characters/JO_neutral.webp",
      smile: "/characters/JO_smile.webp",
      happy: "/characters/JO_happy.webp",
      worried: "/characters/JO_worried.webp",
      sad: "/characters/JO_sad.webp",
      surprised: "/characters/JO_surprised.webp",
      angry: "/characters/JO_angry.webp",
    },
  },
  {
    id: "yuko",
    name: "YUKO",
    tagline: "整理して、前に進める",
    role: "聡明で頼れる女性コーチ",
    tags: ["思考整理", "目標設定", "背中を押す"],
    greeting: "こんにちは、YUKOです。今いちばん気になっていること、聞かせてもらえますか？",
    persona: `あなたは「YUKO」。30代の聡明で温かい女性コーチで、相談者の考えを整理し、次の一歩を引き出すことが得意です。
【話し方】
- 一人称は「私」。丁寧で柔らかい口調（例:「なるほど、そう感じていらっしゃるんですね」「何から話してみましょうか」）
- 相手の言葉を要約して返し、整理の手助けをする
- 最後に、小さく具体的な次の一歩を一緒に考える問いを添える
【スタンス】
- 答えを与えるのではなく、問いで相手の中にある答えを引き出す
- 前向きな変化を見つけたら、はっきり認めて背中を押す`,
    voicePrefs: ["WhiteCUL", "小夜/SAYO", "四国めたん"],
    images: {
      idle: "/characters/YUKO.webp",
      neutral: "/characters/YUKO_neutral.webp",
      smile: "/characters/YUKO.webp", // 専用の笑顔画像なし → 基本画像（微笑み）
      happy: "/characters/YUKO_happy.webp",
      worried: "/characters/YUKO_worried.webp",
      sad: "/characters/YUKO_sad.webp",
      surprised: "/characters/YUKO_surprised.webp",
      angry: "/characters/YUKO_angry.webp",
    },
  },
];

export function getCoach(id: string | null | undefined): Coach | undefined {
  return coaches.find((c) => c.id === id);
}

/* ── 面談練習(/session): 相談者役の3キャラ（既存シナリオに対応） ── */
export const clients: Coach[] = [
  {
    id: "tanaka",
    name: "田中 誠",
    tagline: "昇進したばかりのマネージャー",
    role: "チームリーダー（30代）",
    tags: ["マネジメント", "リーダーシップ", "チームビルディング"],
    greeting: "",
    persona: "",
    voicePrefs: ["離途", "玄野武宏", "白上虎太郎"],
    scenarioId: "team-management",
    images: {
      idle: "/characters/tanaka.webp",
      neutral: "/characters/tanaka_neutral.webp",
      smile: "/characters/tanaka_smile.webp",
      happy: "/characters/tanaka_happy.webp",
      worried: "/characters/tanaka_worried.webp",
      sad: "/characters/tanaka_sad.webp",
      surprised: "/characters/tanaka_surprised.webp",
      angry: "/characters/tanaka_serious.webp",
    },
  },
  {
    id: "sato",
    name: "佐藤 美咲",
    tagline: "キャリアの岐路に立つ会社員",
    role: "会社員（28歳）",
    tags: ["キャリア", "転職", "自己実現"],
    greeting: "",
    persona: "",
    voicePrefs: ["四国めたん", "春日部つむぎ", "九州そら"],
    scenarioId: "career-change",
    images: {
      idle: "/characters/sato.webp",
      neutral: "/characters/sato_neutral.webp",
      smile: "/characters/sato_smile.webp",
      happy: "/characters/sato_happy.webp",
      worried: "/characters/sato_worried.webp",
      sad: "/characters/sato_sad.webp",
      surprised: "/characters/sato_surprised.webp",
      angry: "/characters/sato_angry.webp",
    },
  },
  {
    id: "suzuki",
    name: "鈴木 健一",
    tagline: "仕事と家庭の両立に悩むビジネスパーソン",
    role: "ビジネスパーソン（35歳）",
    tags: ["ワークライフバランス", "家族", "健康管理"],
    greeting: "",
    persona: "",
    voicePrefs: ["青山龍星", "玄野武宏", "白上虎太郎"],
    scenarioId: "work-life-balance",
    images: {
      idle: "/characters/suzuki.webp",
      neutral: "/characters/suzuki.webp",
      smile: "/characters/suzuki_smile.webp",
      happy: "/characters/suzuki_happy.webp",
      worried: "/characters/suzuki_sad.webp",
      sad: "/characters/suzuki_sad.webp",
      surprised: "/characters/suzuki_surprised.webp",
      angry: "/characters/suzuki_angry.webp",
    },
  },
];
