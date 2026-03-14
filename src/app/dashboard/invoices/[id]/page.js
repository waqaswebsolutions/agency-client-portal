import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import mongoose from "mongoose";

export default async function InvoiceDetailsPage({ params }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Await params
  const resolvedParams = await params;
  const invoiceId = resolvedParams.id;

  await dbConnect();

  // Get current user
  const currentUser = await User.findOne({ clerkId: userId });
  
  if (!currentUser) {
    return <div className="text-center py-10">Loading...</div>;
  }

  // Find invoice
  const invoice = await Invoice.findById(invoiceId).populate("clientId");

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
            <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist.</p>
            <Link 
              href="/dashboard/invoices" 
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              ← Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has access
  if (currentUser.role !== "admin" && invoice.clientId?._id?.toString() !== currentUser._id?.toString()) {
    redirect("/dashboard/invoices");
  }

  // Format dates
  const issuedDate = new Date(invoice.issuedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Status colors
  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link 
                href="/dashboard/invoices" 
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Invoices</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <span className="text-gray-300 mx-2 hidden sm:inline">|</span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Invoice {invoice.invoiceNumber}
              </h1>
            </div>
            
            {/* Action Buttons */}
            {currentUser.role === "admin" && (
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/invoices/${invoice._id}/edit`}
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
                >
                  <svg className="w-4 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
              </div>
            )}
          </div>

          {/* Invoice Status Banner */}
          <div className={`${statusColors[invoice.status]} px-6 py-4 rounded-xl flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <span className="font-semibold">Status:</span>
              <span className="capitalize">{invoice.status}</span>
            </div>
            {invoice.status === "overdue" && (
              <p className="text-sm">Payment is overdue. Please contact client.</p>
            )}
          </div>

          {/* Invoice Details Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header with Logo/Title */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">INVOICE</h2>
                  <p className="text-indigo-100">#{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">AgencyPortal</p>
                  <p className="text-indigo-100 text-sm">client@agencyportal.com</p>
                </div>
              </div>
            </div>

            {/* Client and Date Info */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To:</h3>
                  <Link 
                    href={`/dashboard/clients/${invoice.clientId?._id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-lg"
                  >
                    {invoice.clientId?.name || "Unknown Client"}
                  </Link>
                  <p className="text-gray-600 mt-1">{invoice.clientId?.email}</p>
                  {invoice.clientId?.company && (
                    <p className="text-gray-600">{invoice.clientId.company}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Date:</span>
                    <span className="font-medium">{issuedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date:</span>
                    <span className={`font-medium ${invoice.status === "overdue" ? "text-red-600" : ""}`}>
                      {dueDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Due:</span>
                    <span className="font-bold text-xl text-indigo-600">
                      ${invoice.amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Items Table */}
            {invoice.items && invoice.items.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-right text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-900">${item.rate}</td>
                          <td className="px-4 py-3 text-right text-gray-900 font-medium">${item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right font-semibold">Total:</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">
                          ${invoice.amount?.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{invoice.notes}</p>
              </div>
            )}

            {/* Payment Status */}
            {invoice.status === "paid" && invoice.paidAt && (
              <div className="p-6 bg-green-50">
                <div className="flex items-center gap-2 text-green-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Paid on {new Date(invoice.paidAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}