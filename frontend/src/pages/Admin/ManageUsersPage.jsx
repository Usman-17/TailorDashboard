import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

import SectionHeading from "../../components/SectionHeading";

const ROLE_BADGE = {
  super_admin: "bg-red-100 text-red-700",
  owner: "bg-blue-100 text-blue-700",
  staff: "bg-green-100 text-green-700",
};

const ManageUsersPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);

      const res = await fetch(`/api/auth/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to fetch users");

      setData(
        result.map((user, index) => ({
          _id: user._id,
          sr: index + 1,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          shop: user.shop?.name || "-",
          isActive: user.isActive,
        }))
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const filtered = data.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      row.fullName?.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q) ||
      row.mobile?.toLowerCase().includes(q) ||
      row.shop?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <SectionHeading title="Manage Users" subtitle="View all users across the platform" />

        <div className="flex items-center gap-2">
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm text-black bg-white"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search name, email, mobile..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
            className="border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm w-72"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        </div>
        <button
          onClick={() => setSearch(searchInput)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          Search
        </button>
        {search && (
          <button
            onClick={() => { setSearch(""); setSearchInput(""); }}
            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Sr.</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Mobile</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Shop</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{row.sr}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.email}</td>
                    <td className="px-4 py-3 text-gray-600">{row.mobile}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${ROLE_BADGE[row.role] || "bg-gray-100 text-gray-600"}`}>
                        {row.role?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.shop}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm text-black bg-white"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsersPage;
