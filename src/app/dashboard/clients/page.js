import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";

export default async function ClientsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  await dbConnect();
  
  const currentUser = await User.findOne({ clerkId: userId });
  
  if (!currentUser) {
    return <div className="text-center py-10">Loading user data...</div>;
  }

  if (currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const clients = await User.find({ role: "client" }).sort({ createdAt: -1 });

  const clientsWithStats = await Promise.all(
    clients.map(async (client) => {
      const projectsCount = await Project.countDocuments({ clientId: client._id });
      const invoicesCount = await Invoice.countDocuments({ clientId: client._id });
      const totalSpent = await Invoice.aggregate([
        { $match: { clientId: client._id, status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      return {
        ...client.toObject(),
        projectsCount,
        invoicesCount,
        totalSpent: totalSpent[0]?.total || 0
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section - Same spacing as dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all your clients and their projects</p>
          </div>
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base font-medium shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Client
          </Link>
        </div>

        {/* Clients Grid - Fully Responsive */}
        {clientsWithStats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Get started by adding your first client.</p>
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Client
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {clientsWithStats.map((client) => (
              <div
                key={client._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-indigo-200 overflow-hidden"
              >
                {/* Card Content - Clickable Area */}
                <Link href={`/dashboard/clients/${client._id}`} className="block p-6 cursor-pointer">
                  {/* Client Header with Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-bold text-xl">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">{client.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{client.email}</p>
                      {client.company && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{client.company}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid - Better Layout */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-blue-600 font-bold text-lg">{client.projectsCount}</div>
                      <div className="text-xs text-gray-600 font-medium">Projects</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-green-600 font-bold text-lg">{client.invoicesCount}</div>
                      <div className="text-xs text-gray-600 font-medium">Invoices</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-purple-600 font-bold text-lg truncate" title={`$${client.totalSpent.toLocaleString()}`}>
                        ${client.totalSpent.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">Spent</div>
                    </div>
                  </div>

                  {/* Contact Info - If Available */}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 border-t pt-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}

                  {/* Footer with Date */}
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                    <span>Client since {new Date(client.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                    <span className="text-indigo-600 font-medium flex items-center gap-1">
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}