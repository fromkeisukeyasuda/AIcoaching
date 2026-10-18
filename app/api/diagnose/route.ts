import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Answer, SilenceType } from "@/app/diagnose/types";
import { diagnose, getTypeInfo } from "@/app/diagnose/logic";

const anthropic = new Anthropic();

interface DiagnoseRequest {
  answers: Answer[];
  freeText: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: DiagnoseRequest = await req.json();
    const { answers, freeText } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "回答データが不正です" },
        { status: 400 }
      );
    }

    // スコアからタイプを判定
    const result = diagnose(answers);
    const typeInfo = getTypeInfo(result.type);

    // freeTextがある場合はClaudeでパーソナライズされた問いを生成
    let personalizedQuestion = typeInfo.question;

    if (freeText && freeText.trim().length > 0) {
      const systemPrompt = `あなたは経営者向けのエグゼクティブコーチです。
クライアントの内面の沈黙タイプは「${typeInfo.name}」（${typeInfo.essence}）です。
クライアントが書いた自由記述を読み、そのタイプの本質的な問いをパーソナライズしてください。

ルール：
- 問いは1文のみ、30文字以内
- 「」（かぎかっこ）で囲む
- 直接的で、胸に刺さる問いにする
- 余計な説明は一切不要、問いだけを返す`;

      const userPrompt = `クライアントの自由記述：
${freeText}

このクライアントへのパーソナライズされた問いを1つ生成してください。`;

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      });

      const content = message.content[0];
      if (content.type === "text" && content.text.trim()) {
        personalizedQuestion = content.text.trim();
      }
    }

    return NextResponse.json({
      type: result.type as SilenceType,
      personalizedQuestion,
      typeInfo,
      totalScore: result.totalScore,
    });
  } catch (error) {
    console.error("Diagnose API error:", error);
    return NextResponse.json(
      { error: "診断処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
