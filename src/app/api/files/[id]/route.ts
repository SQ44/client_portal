import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const fileId = params.id

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      project: true,
    },
  })

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  // Check if user owns the project or is admin
  if (file.project.clientId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const filePath = path.resolve(file.path)
    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Type": "application/octet-stream",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
  }
}