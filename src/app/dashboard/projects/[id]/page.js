import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import mongoose from "mongoose";

export default async function ProjectDetailsPage({ params }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Await params
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  await dbConnect();

  // Get current user
  const currentUser = await User.findOne({ clerkId: userId });
  
  if (!currentUser) {
    return <div className="text-center py-10">Loading...</div>;
  }

  // Find project
  const project = await Project.findById(projectId).populate("clientId");

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
            <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
            <Link 
              href="/dashboard/projects" 
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate task progress
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link 
                href="/dashboard/projects" 
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Projects</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <span className="text-gray-300 mx-2 hidden sm:inline">|</span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                {project.name}
              </h1>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link
                href={`/dashboard/projects/${project._id}/edit`}
                className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
              >
                <svg className="w-4 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            </div>
          </div>

          {/* Project Info Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">Project Name</h2>
                    <p className="text-lg text-gray-900">{project.name}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">Description</h2>
                    <p className="text-gray-700">{project.description || "No description provided"}</p>
                  </div>

                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">Client</h2>
                    <Link 
                      href={`/dashboard/clients/${project.clientId?._id}`}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {project.clientId?.name || "Unknown Client"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h2 className="text-sm font-medium text-gray-500 mb-1">Status</h2>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        project.status === "completed" ? "bg-green-100 text-green-800" :
                        project.status === "in-progress" ? "bg-blue-100 text-blue-800" :
                        project.status === "review" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div>
                      <h2 className="text-sm font-medium text-gray-500 mb-1">Budget</h2>
                      <p className="text-lg text-gray-900">
                        {project.budget ? `$${project.budget.toLocaleString()}` : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h2 className="text-sm font-medium text-gray-500 mb-1">Start Date</h2>
                      <p className="text-gray-700">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"}
                      </p>
                    </div>
                    
                    <div>
                      <h2 className="text-sm font-medium text-gray-500 mb-1">Deadline</h2>
                      <p className="text-gray-700">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Project Progress</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium text-indigo-600">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-indigo-600 h-3 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Tasks Completed</span>
                    <span className="font-medium text-indigo-600">{completedTasks}/{totalTasks} ({taskProgress}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                + Add Task
              </button>
            </div>
            
            {!project.tasks || project.tasks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No tasks added yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {project.tasks.map((task, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        readOnly
                        className="mt-1 h-4 w-4 text-indigo-600 rounded border-gray-300 cursor-default"
                      />
                      <div>
                        <p className={`text-gray-900 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}