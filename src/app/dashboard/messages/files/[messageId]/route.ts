import { NextResponse, type NextRequest } from "next/server";
import * as db from "@/lib/db";
import { isUuid } from "@/lib/utils";

/**
 * A chat file, by message id. The file itself sits in a private Storage
 * bucket, so this redirects to a short-lived signed link — giving <img> and
 * <video> a URL that stays the same while the chat re-polls. Only the two
 * people in the conversation get a link (RLS on messages and Storage);
 * anyone else gets a 404. Add `?download=1` to save it under its own name.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/dashboard/messages/files/[messageId]">) {
  const { messageId } = await ctx.params;
  if (!isUuid(messageId)) return new NextResponse("Not found", { status: 404 });

  const download = request.nextUrl.searchParams.has("download");
  const url = await db.getAttachmentSignedUrl(messageId, download);
  if (!url) return new NextResponse("Not found", { status: 404 });

  const response = NextResponse.redirect(url, 302);
  // Let the browser reuse the redirect for a while, well inside the link's lifetime.
  response.headers.set("Cache-Control", `private, max-age=${Math.floor(db.ATTACHMENT_LINK_SECONDS / 2)}`);
  return response;
}
