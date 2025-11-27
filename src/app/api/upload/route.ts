import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await request.formData()
  const file: File | null = data.get("file") as unknown as File
  const projectId: string = data.get("projectId") as string

  if (!file || !projectId) {
    return NextResponse.json({ error: "File and projectId are required" }, { status: 400 })
  }

  // Check if project belongs to user
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: session.user.id,
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads")
  try {
    await mkdir(uploadsDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }

  const fileName = `${Date.now()}-${file.name}`
  const filePath = path.join(uploadsDir, fileName)

  await writeFile(filePath, buffer)

  // Save file info to database
  const dbFile = await prisma.file.create({
    data: {
      name: file.name,
      path: filePath,
      projectId,
      uploadedBy: session.user.id,
      type: "upload",
    },
  })

  return NextResponse.json({ file: dbFile })
}