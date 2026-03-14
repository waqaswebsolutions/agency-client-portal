"use client";

import { 
  FolderIcon, 
  CheckCircleIcon, 
  DocumentTextIcon,
  CurrencyDollarIcon 
} from "@heroicons/react/24/outline";

export default function DashboardStats({ 
  totalProjects, 
  completedProjects, 
  totalInvoices, 
  paidInvoices, 
  totalRevenue,
  userRole 
}) {
  const stats = [
    {
      name: userRole === "admin" ? "Total Projects" : "Your Projects",
      value: totalProjects,
      icon: FolderIcon,
      change: "+12%",
      changeType: "positive",
      bgColor: "bg-blue-500",
    },
    {
      name: "Completed",
      value: completedProjects,
      icon: CheckCircleIcon,
      change: "+23%",
      changeType: "positive",
      bgColor: "bg-green-500",
    },
    {
      name: userRole === "admin" ? "Total Invoices" : "Your Invoices",
      value: totalInvoices,
      icon: DocumentTextIcon,
      change: "+4%",
      changeType: "positive",
      bgColor: "bg-purple-500",
    },
    {
      name: userRole === "admin" ? "Revenue" : "Paid Invoices",
      value: userRole === "admin" ? `$${totalRevenue.toLocaleString()}` : paidInvoices,
      icon: CurrencyDollarIcon,
      change: userRole === "admin" ? "+8%" : `${paidInvoices}/${totalInvoices}`,
      changeType: "positive",
      bgColor: "bg-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-medium ${
                stat.changeType === "positive" ? "text-green-600" : "text-red-600"
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-gray-600">{stat.name}</p>
          </div>
        );
      })}
    </div>
  );
}