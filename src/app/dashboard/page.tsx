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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
            <div className="flex items-center space-x-4">
              <span>Welcome, {session?.user?.name}</span>
              {session?.user?.role === "admin" && (
                <a
                  href="/admin"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Admin Panel
                </a>
              )}
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Projects</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Create New Project
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium mb-4">Create New Project</h3>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{project.description}</p>
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-4 space-y-2">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      View Details
                    </button>
                    <div>
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(project.id, e.target.files?.[0])}
                        className="text-sm"
                      />
                    </div>
                    {project.files.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium">Files:</h4>
                        <ul className="text-sm">
                          {project.files.map((file: any) => (
                            <li key={file.id}>
                              <a
                                href={`/api/files/${file.id}`}
                                className="text-blue-600 hover:text-blue-800"
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
                        <h4 className="text-sm font-medium">Invoice:</h4>
                        <p className="text-sm">Amount: ${project.invoice.amount}</p>
                        <p className="text-sm">Status: {project.invoice.status}</p>
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