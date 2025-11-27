import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    where: {
      clientId: session.user.id,
    },
    include: {
      files: true,
      invoice: true,
    },
  })

  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, description } = await request.json()

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      clientId: session.user.id,
    },
  })

  return NextResponse.json(project)
}