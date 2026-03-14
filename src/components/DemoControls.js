"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function DemoControls() {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const seedDemoData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seed-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        // Refresh the page to show new data
        setTimeout(() => window.location.reload(), 1500);
      } else if (data.warning) {
        toast(data.warning, {
          icon: "⚠️",
          duration: 5000
        });
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to create demo data");
    } finally {
      setLoading(false);
    }
  };

  const deleteDemoData = async () => {
    if (!confirm("Are you sure? This will delete ALL demo clients, projects, and invoices.")) {
      return;
    }
    
    setDeleting(true);
    try {
      const res = await fetch("/api/seed-demo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to delete demo data");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-indigo-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🎮 Demo Data Controls</h3>
          <p className="text-sm text-gray-600">Populate your app with realistic demo clients and projects</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={deleteDemoData}
            disabled={deleting}
            className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Demo Data"}
          </button>
          <button
            onClick={seedDemoData}
            disabled={loading}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>Creating...</>
            ) : (
              <>
                <span>✨</span>
                Generate Demo Data
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded-lg">
          <span className="font-medium text-blue-700">5 Clients</span>
          <p className="text-blue-600 text-xs">Acme, Globex, Initech, Stark, Umbrella</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <span className="font-medium text-green-700">~15 Projects</span>
          <p className="text-green-600 text-xs">Different statuses & progress</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <span className="font-medium text-purple-700">~20 Invoices</span>
          <p className="text-purple-600 text-xs">Paid, pending, overdue</p>
        </div>
      </div>
    </div>
  );
}