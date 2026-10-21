import { redirect } from "next/navigation";
import { TALK_ENABLED } from "@/lib/features";

export default function TalkLayout({ children }: { children: React.ReactNode }) {
  if (!TALK_ENABLED) redirect("/");
  return children;
}
