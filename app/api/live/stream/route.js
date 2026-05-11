import { dbGetLive } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let intervalId;

  const stream = new ReadableStream({
    async start(controller) {
      const push = async () => {
        try {
          const data = await dbGetLive();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          try { controller.close(); } catch {}
          clearInterval(intervalId);
        }
      };

      await push();                          // send immediately on connect
      intervalId = setInterval(push, 2000); // then every 2s
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
