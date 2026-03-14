"use client";

import Link from "next/link";
import { format } from "date-fns";

const statusColors = {
  "planning": "bg-gray-100 text-gray-800",
  "in-progress": "bg-blue-100 text-blue-800",
  "review": "bg-yellow-100 text-yellow-800",
  "completed": "bg-green-100 text-green-800",
};

export default function RecentProjects({ projects }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
        <Link 
          href="/dashboard/projects" 
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          View all
        </Link>
      </div>
      
      {projects.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No projects yet</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/dashboard/projects/${project._id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{project.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {project.clientId?.name || "Unknown Client"}
                </span>
                <span className="text-gray-500">
                  {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "No deadline"}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900 font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}