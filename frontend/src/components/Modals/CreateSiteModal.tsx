import React, { useState } from "react";
import { createSite } from "../../services/apiService"; // Import service

const CreateSiteModal: React.FC = () => {
  const [open, setOpen] = useState(false); // Modal visibility
  const [siteLabel, setSiteLabel] = useState(""); // Input field value
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error message
  const [success, setSuccess] = useState<string | null>(null); // Success message

  // Function to handle form submission
  const handleCreateSite = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent form reload

    if (!siteLabel) {
      setError("Site label is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const site = await createSite(siteLabel); // Call the service function
      setSuccess(`Site "${site.name}" created successfully!`);
      setSiteLabel(""); // Clear input field
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* Open Modal Button */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Create New Site
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-96">
            <h2 className="mb-4 text-xl font-bold">Create a New Site</h2>

            <form onSubmit={handleCreateSite} className="space-y-4">
              {/* Site Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteLabel}
                  onChange={(e) => setSiteLabel(e.target.value)}
                  placeholder="Enter site name"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Error Message */}
              {error && <p className="text-sm text-red-500">{error}</p>}

              {/* Success Message */}
              {success && <p className="text-sm text-green-500">{success}</p>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Creating..." : "Create Site"}
              </button>
            </form>

            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-4 text-sm text-gray-600 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSiteModal;
