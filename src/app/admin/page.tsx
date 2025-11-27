"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  clientId: string
  client: { name: string; email: string }
  files: { id: string; name: string; type: string }[]
  invoice: { id: string; amount: number; status: string } | null
  createdAt: string
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [invoiceDrafts, setInvoiceDrafts] = useState<Record<string, { amount: string; status: string }>>({})

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    const drafts = projects.reduce((acc, project) => {
      acc[project.id] = {
        amount: project.invoice ? project.invoice.amount.toString() : "",
        status: project.invoice ? project.invoice.status : "draft",
      }
      return acc
    }, {} as Record<string, { amount: string; status: string }>)
    setInvoiceDrafts(drafts)
  }, [projects])

  const fetchProjects = async () => {
    const res = await fetch("/api/admin/projects")
    if (res.ok) {
      const data = await res.json()
      setProjects(data)
    }
  }

  const updateProjectStatus = async (projectId: string, status: string) => {
    const res = await fetch(`/api/admin/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      fetchProjects()
    }
  }

  const handleDeliverableUpload = async (projectId: string, file: File | undefined) => {
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("projectId", projectId)
    formData.append("type", "download")

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (res.ok) {
      fetchProjects()
    }
  }

  const handleInvoiceFieldChange = (projectId: string, field: "amount" | "status", value: string) => {
    setInvoiceDrafts((prev) => {
      const existing = prev[projectId] ?? { amount: "", status: "draft" }
      return {
        ...prev,
        [projectId]: {
          ...existing,
          [field]: value,
        },
      }
    })
  }

  const handleInvoiceSave = async (projectId: string) => {
    const draft = invoiceDrafts[projectId]
    if (!draft || !draft.amount) return

    const amount = parseFloat(draft.amount)
    if (isNaN(amount)) return

    const res = await fetch(`/api/admin/projects/${projectId}/invoice`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        status: draft.status || "draft",
      }),
    })

    if (res.ok) {
      fetchProjects()
    }
  }

  if (session?.user?.role !== "admin") {
    return <div>Access denied</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <span>Welcome, {session?.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">All Projects</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const clientUploads = project.files.filter((file) => file.type === "upload")
              const deliverables = project.files.filter((file) => file.type === "download")

              return (
                <div key={project.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{project.description}</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Client: {project.client.name} ({project.client.email})
                    </p>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-800">Status</label>
                      <select
                        value={project.status}
                        onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 text-sm text-gray-900 shadow-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-800">Client Uploads</h4>
                      {clientUploads.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          {clientUploads.map((file) => (
                            <li key={file.id}>{file.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">No files from client yet.</p>
                      )}
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">Deliverables</h4>
                        <label className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              handleDeliverableUpload(project.id, e.target.files?.[0])
                              if (e.target.value) e.target.value = ""
                            }}
                          />
                        </label>
                      </div>
                      {deliverables.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          {deliverables.map((file) => (
                            <li key={file.id}>
                              <a
                                href={`/api/files/${file.id}`}
                                className="font-semibold text-indigo-600 hover:text-indigo-800"
                                download
                              >
                                {file.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">No deliverables uploaded.</p>
                      )}
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-800">Invoice</h4>
                      <form
                        className="mt-3 space-y-3"
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleInvoiceSave(project.id)
                        }}
                      >
                        <div>
                          <label className="block text-xs font-semibold text-gray-600">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={invoiceDrafts[project.id]?.amount ?? ""}
                            onChange={(e) => handleInvoiceFieldChange(project.id, "amount", e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600">Status</label>
                          <select
                            value={invoiceDrafts[project.id]?.status ?? "draft"}
                            onChange={(e) => handleInvoiceFieldChange(project.id, "status", e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 text-sm text-gray-900 shadow-sm"
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                        >
                          Save Invoice
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
