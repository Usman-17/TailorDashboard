import SectionHeading from "../../components/SectionHeading";
import useGetAuth from "../../hooks/useGetAuth";

const SettingsPage = () => {
  const { data: authUser } = useGetAuth();

  return (
    <div className="max-w-2xl">
      <SectionHeading
        title="Settings"
        subtitle="Platform configuration and profile"
      />

      <div className="mt-6 space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Your Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name</label>
              <p className="text-sm font-medium text-gray-900">{authUser?.fullName || "-"}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <p className="text-sm font-medium text-gray-900">{authUser?.email || "-"}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mobile</label>
              <p className="text-sm font-medium text-gray-900">{authUser?.mobile || "-"}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <p className="text-sm font-medium text-gray-900 capitalize">{authUser?.role?.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Platform</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Application</label>
              <p className="text-sm font-medium text-gray-900">Tailor Dashboard</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Currency</label>
              <p className="text-sm font-medium text-gray-900">PKR (Rs.)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
