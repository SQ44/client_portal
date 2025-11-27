import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { amount, status } = await request.json()

  if (typeof amount !== "number" || isNaN(amount) || amount < 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  const allowedStatuses = ["draft", "sent", "paid"]
  const invoiceStatus = allowedStatuses.includes(status) ? status : "draft"

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const invoice = await prisma.invoice.upsert({
    where: { projectId: params.id },
    update: {
      amount,
      status: invoiceStatus,
    },
    create: {
      projectId: params.id,
      amount,
      status: invoiceStatus,
    },
  })

  return NextResponse.json(invoice)
}
