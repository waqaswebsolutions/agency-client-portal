import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  await dbConnect();
  
  // Get current user from MongoDB
  let currentUser = await User.findOne({ clerkId: userId });
  
  // If user doesn't exist in MongoDB, create them automatically
  if (!currentUser) {
    try {
      // Fetch user details from Clerk API
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      });
      
      const clerkUser = await clerkRes.json();
      
      // Create user in MongoDB
      currentUser = await User.create({
        clerkId: userId,
        email: clerkUser.email_addresses[0]?.email_address,
        name: clerkUser.first_name && clerkUser.last_name 
          ? `${clerkUser.first_name} ${clerkUser.last_name}`.trim()
          : clerkUser.email_addresses[0]?.email_address || "User",
        role: "admin",
      });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  // Fetch data based on user role
  let projects = [];
  let invoices = [];
  
  if (currentUser?.role === "admin") {
    projects = await Project.find().populate("clientId").sort({ createdAt: -1 }).limit(5);
    invoices = await Invoice.find().populate("clientId").sort({ createdAt: -1 }).limit(5);
  } else {
    projects = await Project.find({ clientId: currentUser?._id }).sort({ createdAt: -1 }).limit(5);
    invoices = await Invoice.find({ clientId: currentUser?._id }).sort({ createdAt: -1 }).limit(5);
  }

  // Calculate stats
  const totalProjects = await Project.countDocuments(currentUser?.role === "admin" ? {} : { clientId: currentUser?._id });
  const completedProjects = await Project.countDocuments({ 
    ...(currentUser?.role === "admin" ? {} : { clientId: currentUser?._id }),
    status: "completed" 
  });
  const inProgressProjects = await Project.countDocuments({ 
    ...(currentUser?.role === "admin" ? {} : { clientId: currentUser?._id }),
    status: "in-progress" 
  });
  
  const totalInvoices = await Invoice.countDocuments(currentUser?.role === "admin" ? {} : { clientId: currentUser?._id });
  const paidInvoices = await Invoice.countDocuments({ 
    ...(currentUser?.role === "admin" ? {} : { clientId: currentUser?._id }),
    status: "paid" 
  });
  const pendingInvoices = await Invoice.countDocuments({ 
    ...(currentUser?.role === "admin" ? {} : { clientId: currentUser?._id }),
    status: { $in: ["sent", "draft"] }
  });
  
  const paidInvoicesData = await Invoice.find({ 
    ...(currentUser?.role === "admin" ? {} : { clientId: currentUser?._id }),
    status: "paid" 
  });
  const totalRevenue = paidInvoicesData.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {currentUser?.name || "User"}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Here's what's happening with your projects today.
            </p>
          </div>
          
          {/* Quick Action Buttons - Stack on mobile */}
          {currentUser?.role === "admin" && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </Link>
              <Link
                href="/dashboard/clients/new"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Client
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid - Responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Projects"
            value={totalProjects}
            subtext={`${completedProjects} completed • ${inProgressProjects} in progress`}
            icon={
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            bgColor="bg-blue-100"
          />
          
          <StatCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            subtext={`${paidInvoices} paid • ${pendingInvoices} pending`}
            icon={
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-green-100"
          />
          
          <StatCard
            title="Total Invoices"
            value={totalInvoices}
            subtext={`${paidInvoices} paid • ${pendingInvoices} pending`}
            icon={
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            bgColor="bg-purple-100"
          />
          
          <StatCard
            title="Active Projects"
            value={inProgressProjects}
            subtext={getNextDeadlineText(projects)}
            icon={
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-yellow-100"
          />
        </div>

        {/* Recent Projects & Invoices - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <SectionCard
            title="Recent Projects"
            viewAllLink="/dashboard/projects"
            viewAllText="View all projects"
          >
            {projects.length === 0 ? (
              <EmptyState
                message="No projects yet"
                actionLink="/dashboard/projects/new"
                actionText="Create your first project"
              />
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <ProjectItem key={project._id} project={project} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Recent Invoices */}
          <SectionCard
            title="Recent Invoices"
            viewAllLink="/dashboard/invoices"
            viewAllText="View all invoices"
          >
            {invoices.length === 0 ? (
              <EmptyState
                message="No invoices yet"
                actionLink="/dashboard/invoices/new"
                actionText="Create your first invoice"
              />
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <InvoiceItem key={invoice._id} invoice={invoice} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Quick Links - Responsive Grid for Mobile */}
        {currentUser?.role === "admin" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <QuickLink
              href="/dashboard/projects"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              label="All Projects"
            />
            <QuickLink
              href="/dashboard/invoices"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              label="All Invoices"
            />
            <QuickLink
              href="/dashboard/clients"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              label="All Clients"
            />
            <QuickLink
              href="/dashboard/settings"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="Settings"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components

function StatCard({ title, value, subtext, icon, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-xs sm:text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-xs text-gray-500 truncate" title={subtext}>{subtext}</p>
    </div>
  );
}

function SectionCard({ title, viewAllLink, viewAllText, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
        <Link
          href={viewAllLink}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          {viewAllText}
        </Link>
      </div>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ message, actionLink, actionText }) {
  return (
    <div className="text-center py-8 sm:py-12">
      <p className="text-sm sm:text-base text-gray-500 mb-4">{message}</p>
      <Link
        href={actionLink}
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm sm:text-base"
      >
        {actionText} →
      </Link>
    </div>
  );
}

function ProjectItem({ project }) {
  const statusColors = {
    completed: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    review: "bg-yellow-100 text-yellow-800",
    planning: "bg-gray-100 text-gray-800"
  };

  return (
    <Link
      href={`/dashboard/projects/${project._id}`}
      className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate pr-2">{project.name}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
          statusColors[project.status] || "bg-gray-100 text-gray-800"
        }`}>
          {project.status}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-gray-600 truncate">
          {project.clientId?.name || "Unknown Client"}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="text-gray-900 font-medium">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function InvoiceItem({ invoice }) {
  const statusColors = {
    paid: "bg-green-100 text-green-800",
    sent: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800"
  };

  return (
    <Link
      href={`/dashboard/invoices/${invoice._id}`}
      className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
          <p className="text-xs text-gray-600 mt-0.5 truncate">
            {invoice.clientId?.name || "Unknown Client"}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${
          statusColors[invoice.status] || "bg-gray-100 text-gray-800"
        }`}>
          {invoice.status}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900">
          ${invoice.amount?.toLocaleString() || 0}
        </span>
        {invoice.dueDate && (
          <span className="text-xs text-gray-500">
            Due {new Date(invoice.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
}

function QuickLink({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <span className="text-xs text-gray-600 text-center">{label}</span>
    </Link>
  );
}

function getNextDeadlineText(projects) {
  const activeProjects = projects.filter(p => p.status === "in-progress" && p.deadline);
  if (activeProjects.length === 0) return "No deadlines";
  
  const nextDeadline = activeProjects.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0].deadline;
  return `Next: ${new Date(nextDeadline).toLocaleDateString()}`;
}