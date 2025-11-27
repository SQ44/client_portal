"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  files: any[]
  invoice: any | null
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({ title: "", description: "" })

  const fetchProjects = async () => {
    const res = await fetch("/api/projects")
    if (res.ok) {
      const data = await res.json()
      setProjects(data)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    })
    if (res.ok) {
      setNewProject({ title: "", description: "" })
      setShowCreateForm(false)
      fetchProjects()
    }
  }

  const handleFileUpload = async (projectId: string, file: File | undefined) => {
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("projectId", projectId)

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (res.ok) {
      fetchProjects() // Refresh to show uploaded files
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
            <div className="flex items-center gap-4 text-sm font-semibold text-gray-800">
              <span className="text-gray-900">Welcome, {session?.user?.name}</span>
              {session?.user?.role === "admin" && (
                <a
                  href="/admin"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700"
                >
                  Admin Panel
                </a>
              )}
              <button
                onClick={() => signOut()}
                className="rounded-lg bg-red-600 px-4 py-2 text-white shadow-sm transition hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Your Projects</h2>
              <p className="text-sm text-gray-600">
                Keep everything in one place with a quick overview of active work.
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Create New Project
            </button>
          </div>

          {showCreateForm && (
            <div className="mx-auto mb-8 w-full max-w-3xl rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Create New Project</h3>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-800">Title</label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-800">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{project.description}</p>
                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : project.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-4 space-y-2">
                    <button className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-900">
                      View Details
                    </button>
                    <div>
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(project.id, e.target.files?.[0])}
                        className="text-sm text-gray-600"
                      />
                    </div>
                    {project.files.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">Files:</h4>
                        <ul className="text-sm text-gray-600">
                          {project.files.map((file: any) => (
                            <li key={file.id}>
                              <a
                                href={`/api/files/${file.id}`}
                                className="font-semibold text-blue-600 transition hover:text-blue-800"
                                download
                              >
                                {file.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {project.invoice && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">Invoice:</h4>
                        <p className="text-sm text-gray-600">Amount: ${project.invoice.amount}</p>
                        <p className="text-sm text-gray-600">Status: {project.invoice.status}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
