"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EditInvoicePage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [clients, setClients] = useState([]);
  const [invoiceId, setInvoiceId] = useState(null);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    clientId: "",
    amount: "",
    issuedDate: "",
    dueDate: "",
    status: "draft",
    notes: "",
  });

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setInvoiceId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  // Fetch clients and invoice data
  useEffect(() => {
    if (invoiceId) {
      fetchClients();
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchInvoice = async () => {
    try {
      setFetching(true);
      const res = await fetch(`/api/invoices/${invoiceId}`);
      
      if (res.status === 404) {
        toast.error("Invoice not found");
        setTimeout(() => router.push("/dashboard/invoices"), 2000);
        return;
      }
      
      if (!res.ok) throw new Error("Failed to fetch invoice");
      
      const data = await res.json();
      
      // Format dates for input
      const issuedDate = data.issuedDate ? new Date(data.issuedDate).toISOString().split('T')[0] : '';
      const dueDate = data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '';
      
      setFormData({
        invoiceNumber: data.invoiceNumber || "",
        clientId: data.clientId?._id || data.clientId || "",
        amount: data.amount || "",
        issuedDate: issuedDate,
        dueDate: dueDate,
        status: data.status || "draft",
        notes: data.notes || "",
      });
    } catch (error) {
      toast.error("Failed to load invoice data");
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Invoice updated successfully!");
        router.push(`/dashboard/invoices/${invoiceId}`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to update invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Invoice deleted successfully!");
        router.push("/dashboard/invoices");
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete invoice");
      }
    } catch (error) {
      toast.error("Failed to delete invoice");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="mb-4 sm:mb-5 md:mb-6">
            <Link 
              href={`/dashboard/invoices/${invoiceId}`} 
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors text-xs sm:text-sm md:text-base mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Invoice
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Edit Invoice</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1">Update invoice information below</p>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6">
            
            {/* Invoice Number */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., INV-2024-001"
              />
            </div>

            {/* Client Selection */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} {client.company ? `(${client.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Amount ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="5000.00"
              />
            </div>

            {/* Issue Date and Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.issuedDate}
                  onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Payment terms, additional notes..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              
              <Link
                href={`/dashboard/invoices/${invoiceId}`}
                className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                Cancel
              </Link>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="cursor-pointer inline-flex items-center justify-center gap-2 border border-red-300 bg-white text-red-600 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-red-50 transition-all font-medium text-sm sm:text-base w-full sm:w-auto sm:ml-auto"
              >
                <svg className="w-4 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}