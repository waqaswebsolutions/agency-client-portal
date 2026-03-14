import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import mongoose from "mongoose";

export default async function ClientDetailsPage({ params }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Await the params Promise
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  
  console.log("✅ Client ID extracted:", clientId);

  if (!clientId) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto bg-white rounded-xl shadow-sm p-8">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Error: No Client ID</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">No client ID was provided in the URL.</p>
          <Link 
            href="/dashboard/clients" 
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <svg className="w-4 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  // Validate MongoDB ID format
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto bg-white rounded-xl shadow-sm p-8">
          <div className="bg-yellow-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Invalid Client ID Format</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-2 break-all">The ID "{clientId}" is not valid.</p>
          <p className="text-xs sm:text-sm text-gray-500 mb-6">Expected format: 24 character hex string</p>
          <Link 
            href="/dashboard/clients" 
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <svg className="w-4 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  await dbConnect();

  // Find the client
  let client;
  try {
    client = await User.findById(clientId);
  } catch (error) {
    console.error("Error finding client:", error);
  }

  if (!client) {
    // Get all clients for debugging
    const allClients = await User.find({ role: "client" }).select("_id name email").limit(5);
    
    return (
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
            <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Client Not Found</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Could not find client with ID:</p>
            <code className="bg-gray-100 px-3 sm:px-4 py-2 rounded block mb-6 text-xs sm:text-sm break-all font-mono">
              {clientId}
            </code>
            
            {allClients.length > 0 ? (
              <div className="text-left bg-yellow-50 p-4 sm:p-6 rounded-lg mb-8">
                <h2 className="font-semibold text-yellow-800 mb-4 text-sm sm:text-base">Available Clients:</h2>
                <div className="space-y-3">
                  {allClients.map(c => (
                    <div key={c._id.toString()} className="border-b border-yellow-200 pb-3 last:border-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{c.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{c.email}</p>
                          <code className="text-2xs sm:text-xs bg-yellow-100 px-2 py-1 rounded mt-1 inline-block">
                            {c._id.toString()}
                          </code>
                        </div>
                        <Link 
                          href={`/dashboard/clients/${c._id.toString()}`}
                          className="text-indigo-600 text-xs sm:text-sm hover:underline inline-flex items-center gap-1"
                        >
                          View
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-500 mb-8">No clients found in database.</p>
            )}
            
            <Link 
              href="/dashboard/clients" 
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-4 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get client's projects and invoices
  const projects = await Project.find({ clientId: client._id }).sort({ createdAt: -1 });
  const invoices = await Invoice.find({ clientId: client._id }).sort({ createdAt: -1 });

  // Calculate statistics
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const inProgressProjects = projects.filter(p => p.status === "in-progress").length;
  
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "paid").length;
  const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "draft").length;
  const overdueInvoices = invoices.filter(i => i.status === "overdue").length;
  
  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  
  const pendingRevenue = invoices
    .filter(i => i.status === "sent" || i.status === "draft")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Link 
                href="/dashboard/clients" 
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors text-xs sm:text-sm md:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Clients</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <span className="text-gray-300 mx-1 sm:mx-2 hidden sm:inline">|</span>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">
                {client.name}
              </h1>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row sm:flex-row gap-2 sm:gap-3">
              <Link
                href={`/dashboard/clients/${client._id}/edit`}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 border border-gray-300 bg-white text-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm md:text-base w-full xs:w-auto"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </Link>
              <Link
                href={`/dashboard/projects/new?clientId=${client._id}`}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-indigo-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm md:text-base w-full xs:w-auto"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Project</span>
              </Link>
            </div>
          </div>

          {/* Client Info Card */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 md:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 md:gap-6">
                {/* Avatar */}
                <div className="flex justify-center sm:justify-start">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                      {client.name.charAt(0)}
                    </span>
                  </div>
                </div>
                
                {/* Client Details */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                    {client.name}
                  </h2>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    {client.email && (
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="break-all">{client.email}</span>
                      </p>
                    )}
                    
                    {client.company && (
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{client.company}</span>
                      </p>
                    )}
                    
                    {client.phone && (
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{client.phone}</span>
                      </p>
                    )}
                  </div>
                  
                  <p className="text-2xs sm:text-xs md:text-sm text-gray-500 mt-3 sm:mt-4 flex items-center justify-center sm:justify-start gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Client since {new Date(client.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Projects"
              value={totalProjects}
              subtext={`${completedProjects} completed • ${inProgressProjects} in progress`}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              bgColor="bg-blue-100"
            />
            
            <StatCard
              title="Total Revenue"
              value={`$${totalRevenue.toLocaleString()}`}
              subtext={`$${pendingRevenue.toLocaleString()} pending`}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              bgColor="bg-green-100"
            />
            
            <StatCard
              title="Total Invoices"
              value={totalInvoices}
              subtext={`${paidInvoices} paid • ${pendingInvoices} pending • ${overdueInvoices} overdue`}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              bgColor="bg-yellow-100"
            />
          </div>

          {/* Projects Section */}
          <SectionCard
            title="Projects"
            addLink={`/dashboard/projects/new?clientId=${client._id}`}
            addText="+ Add Project"
          >
            {projects.length === 0 ? (
              <EmptyState
                message="No projects for this client yet."
                actionLink={`/dashboard/projects/new?clientId=${client._id}`}
                actionText="Create your first project"
              />
            ) : (
              <div className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <ProjectItem key={project._id} project={project} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Invoices Section */}
          <SectionCard
            title="Invoices"
            addLink={`/dashboard/invoices/new?clientId=${client._id}`}
            addText="+ Create Invoice"
          >
            {invoices.length === 0 ? (
              <EmptyState
                message="No invoices for this client yet."
                actionLink={`/dashboard/invoices/new?clientId=${client._id}`}
                actionText="Create your first invoice"
              />
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                        <th scope="col" className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="hidden sm:table-cell px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="hidden lg:table-cell px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <InvoiceRow key={invoice._id} invoice={invoice} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, subtext, icon, bgColor }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">{value}</h3>
      <p className="text-2xs sm:text-xs md:text-sm text-gray-600 mb-0.5 sm:mb-1">{title}</p>
      <p className="text-2xs sm:text-xs text-gray-500 truncate" title={subtext}>{subtext}</p>
    </div>
  );
}

function SectionCard({ title, children, addLink, addText }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
      <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 border-b border-gray-200 bg-gray-50 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{title}</h2>
        <Link
          href={addLink}
          className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm font-medium inline-flex items-center gap-1"
        >
          {addText}
        </Link>
      </div>
      <div className="p-3 sm:p-4 md:p-5 lg:p-6">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ message, actionLink, actionText }) {
  return (
    <div className="text-center py-6 sm:py-8 md:py-10">
      <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4">{message}</p>
      <Link
        href={actionLink}
        className="inline-flex items-center gap-1 sm:gap-2 text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm md:text-base"
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
    <div className="py-3 sm:py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base md:text-lg mb-1 truncate">{project.name}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{project.description}</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-2xs sm:text-xs">
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${statusColors[project.status] || "bg-gray-100 text-gray-800"}`}>
              {project.status}
            </span>
            {project.budget && (
              <span className="text-gray-600 bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                ${project.budget.toLocaleString()}
              </span>
            )}
            {project.deadline && (
              <span className="text-gray-600 bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                Due {new Date(project.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/dashboard/projects/${project._id}`}
          className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm font-medium flex items-center gap-1 self-end sm:self-center mt-1 sm:mt-0"
        >
          View
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice }) {
  const statusColors = {
    paid: "bg-green-100 text-green-800",
    sent: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800"
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-2xs sm:text-xs md:text-sm font-medium text-gray-900">
        {invoice.invoiceNumber}
      </td>
      <td className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-2xs sm:text-xs md:text-sm text-gray-900">
        ${invoice.amount?.toLocaleString()}
      </td>
      <td className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-2xs sm:text-xs font-medium rounded-full ${statusColors[invoice.status] || "bg-gray-100 text-gray-800"}`}>
          {invoice.status}
        </span>
      </td>
      <td className="hidden sm:table-cell px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-2xs sm:text-xs md:text-sm text-gray-600">
        {new Date(invoice.issuedDate).toLocaleDateString()}
      </td>
      <td className="hidden lg:table-cell px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-2xs sm:text-xs md:text-sm text-gray-600">
        {new Date(invoice.dueDate).toLocaleDateString()}
      </td>
      <td className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-2xs sm:text-xs md:text-sm">
        <Link
          href={`/dashboard/invoices/${invoice._id}`}
          className="text-indigo-600 hover:text-indigo-900"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function getNextDeadlineText(projects) {
  const activeProjects = projects.filter(p => p.status === "in-progress" && p.deadline);
  if (activeProjects.length === 0) return "No deadlines";
  
  const nextDeadline = activeProjects.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0].deadline;
  return `Next: ${new Date(nextDeadline).toLocaleDateString()}`;
}