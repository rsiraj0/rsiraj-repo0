import { NextResponse } from "next/server";
import { z } from "zod";
import { generateComponent } from "@/lib/ai";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/vfs";

export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().min(1).max(4000),
  projectId: z.string().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(40)
    .optional(),
  currentFiles: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await generateComponent(parsed.data);

  const session = await readSession();
  if (session && parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: session.userId },
    });
    if (project) {
      const nextMessages = [
        ...JSON.parse(project.messages || "[]"),
        { role: "user", content: parsed.data.prompt },
        { role: "assistant", content: result.explanation },
      ];
      await prisma.project.update({
        where: { id: project.id },
        data: {
          files: serialize(result.files),
          messages: JSON.stringify(nextMessages),
        },
      });
    }
  } else if (session && !parsed.data.projectId) {
    // Auto-create a project on first generation
    await prisma.project.create({
      data: {
        userId: session.userId,
        name: parsed.data.prompt.slice(0, 50),
        files: serialize(result.files),
        messages: JSON.stringify([
          { role: "user", content: parsed.data.prompt },
          { role: "assistant", content: result.explanation },
        ]),
      },
    });
  }

  return NextResponse.json(result);
}
