"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EditClientPage({ params }) {
  // Unwrap params
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });

  // Fetch client data on component mount
  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setFetching(true);
      const res = await fetch(`/api/clients/${clientId}`);
      
      if (res.status === 404) {
        toast.error("Client not found. Redirecting to clients list...");
        setTimeout(() => {
          router.push("/dashboard/clients");
        }, 2000);
        return;
      }
      
      if (!res.ok) throw new Error("Failed to fetch client");
      
      const data = await res.json();
      setOriginalEmail(data.email); // Store original email for comparison
      setFormData({
        name: data.name || "",
        email: data.email || "",
        company: data.company || "",
        phone: data.phone || "",
      });
    } catch (error) {
      toast.error("Failed to load client data");
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  // Email validation function
  const validateEmail = async (email) => {
    // If email hasn't changed, it's valid
    if (!email || email === originalEmail) {
      setEmailError("");
      return true;
    }
    
    try {
      const res = await fetch(`/api/check-email?email=${encodeURIComponent(email)}&excludeId=${clientId}`);
      const data = await res.json();
      
      if (data.exists) {
        setEmailError("This email is already registered. Please use a different email.");
        return false;
      } else {
        setEmailError("");
        return true;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return true; // Allow submission if check fails
    }
  };

  const handleEmailChange = async (e) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    await validateEmail(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email before submission
    const isValid = await validateEmail(formData.email);
    if (!isValid) {
      toast.error("Please fix the errors before submitting.");
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Client updated successfully!");
        router.push(`/dashboard/clients/${clientId}`);
        router.refresh();
      } else {
        if (res.status === 400) {
          setEmailError(data.error);
          toast.error(data.error);
        } else {
          toast.error(data.error || "Something went wrong");
        }
      }
    } catch (error) {
      toast.error("Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Client deleted successfully!");
        router.push("/dashboard/clients");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete client");
      }
    } catch (error) {
      toast.error("Failed to delete client");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while fetching client data
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading client data...</p>
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
              href={`/dashboard/clients/${clientId}`} 
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors text-xs sm:text-sm md:text-base mb-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Client
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Edit Client</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1">Update client information below</p>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6">
            
            {/* Client Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-text"
                placeholder="e.g., Acme Corporation"
              />
            </div>

            {/* Email with validation */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={handleEmailChange}
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-text ${
                  emailError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="contact@acme.com"
              />
              {emailError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {emailError}
                </p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-text"
                placeholder="Acme Inc."
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-text"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2 sm:gap-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs sm:text-sm text-blue-800">
                  <span className="font-semibold">Note:</span> Changes made here will be reflected immediately in all projects and invoices associated with this client.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading || !!emailError}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base w-full sm:w-auto cursor-pointer"
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
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              
              <Link
                href={`/dashboard/clients/${clientId}`}
                className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm sm:text-base w-full sm:w-auto cursor-pointer"
              >
                Cancel
              </Link>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 border border-red-300 bg-white text-red-600 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-red-50 transition-all font-medium text-sm sm:text-base w-full sm:w-auto sm:ml-auto cursor-pointer"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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