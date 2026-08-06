import { NextResponse } from "next/server";
import { checkChatId } from "@/services/chatValidation.service";

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;

  if (!chatId) {
    return NextResponse.json({ valid: false, reason: "Missing Chat ID" }, { status: 400 });
  }

  const result = await checkChatId(chatId);

  if (result.reason === "Unauthorized") {
    return NextResponse.json({ valid: false, reason: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(result);
}
