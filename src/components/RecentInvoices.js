"use client";

import Link from "next/link";
import { format } from "date-fns";

const statusColors = {
  "draft": "bg-gray-100 text-gray-800",
  "sent": "bg-blue-100 text-blue-800",
  "paid": "bg-green-100 text-green-800",
  "overdue": "bg-red-100 text-red-800",
};

export default function RecentInvoices({ invoices }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
        <Link 
          href="/dashboard/invoices" 
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          View all
        </Link>
      </div>
      
      {invoices.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No invoices yet</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Link
              key={invoice._id}
              href={`/dashboard/invoices/${invoice._id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {invoice.clientId?.name || "Unknown Client"}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[invoice.status]}`}>
                  {invoice.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">
                  ${invoice.amount.toLocaleString()}
                </span>
                <span className="text-gray-500">
                  Due {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}