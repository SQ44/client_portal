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
  files: any[]
  invoice: any | null
  createdAt: string
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchProjects()
  }, [])

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{project.description}</p>
                  <p className="mt-2 text-sm text-gray-500">Client: {project.client.name} ({project.client.email})</p>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={project.status}
                      onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  {project.files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium">Files:</h4>
                      <ul className="text-sm">
                        {project.files.map((file: any) => (
                          <li key={file.id}>{file.name} ({file.type})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}