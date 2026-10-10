"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  UserPlus,
  Search,
  RefreshCw,
  Users,
  ShieldCheck,
  ShieldOff,
  X,
  Mail,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  BriefcaseBusiness,
  Crown,
  GraduationCap,
  BookOpen,
  Pencil,
  Trash2,
  Check,
  Square,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ROLES = [
  {
    value: "admin",
    label: "Admin",
  },
  {
    value: "hod",
    label: "HOD",
  },
  {
    value: "principal",
    label: "Principal",
  },
  {
    value: "staff",
    label: "Staff",
  },
  {
    value: "mag_coordinator",
    label: "Magazine Coordinator",
  },
  {
    value: "student",
    label: "Student",
  },
];

const DEPARTMENTS = [
  {
    value: "AT",
    label: "Automobile Engineering",
  },
  {
    value: "CE",
    label: "Civil Engineering",
  },
  {
    value: "ME",
    label: "Mechanical Engineering",
  },
  {
    value: "EE",
    label: "Electrical & Electronics Engineering",
  },
  {
    value: "CH",
    label: "Chemical Engineering",
  },
  {
    value: "PS",
    label: "Polymer Technology",
  },
  {
    value: "EC",
    label: "Electronics & Communication Engineering",
  },
  {
    value: "CS",
    label: "Computer Science & Engineering",
  },
  {
    value: "SC",
    label: "Science",
  },
  {
    value: "IN",
    label: "Institute",
  },
];

// =====================================================
// ROLE COLORS / ICONS
// =====================================================

const getRoleStyle = (role) => {
  switch (role) {
    case "admin":
      return {
        label: "Admin",
        className:
          "bg-amber-50 text-amber-700 border-amber-200",
        icon: ShieldCheck,
      };

    case "hod":
      return {
        label: "HOD",
        className:
          "bg-blue-50 text-blue-700 border-blue-200",
        icon: GraduationCap,
      };

    case "principal":
      return {
        label: "Principal",
        className:
          "bg-purple-50 text-purple-700 border-purple-200",
        icon: Crown,
      };

    case "staff":
      return {
        label: "Staff",
        className:
          "bg-slate-100 text-slate-700 border-slate-200",
        icon: BriefcaseBusiness,
      };

    case "mag_coordinator":
      return {
        label: "Magazine Coordinator",
        className:
          "bg-teal-50 text-teal-700 border-teal-200",
        icon: BookOpen,
      };

    case "student":
      return {
        label: "Student",
        className:
          "bg-green-50 text-green-700 border-green-200",
        icon: User,
      };

    default:
      return {
        label: role || "-",
        className:
          "bg-slate-100 text-slate-700 border-slate-200",
        icon: User,
      };
  }
};

// =====================================================
// MAIN PAGE
// =====================================================

export default function AdminUsersPage() {
  const {
    getToken,
    isLoaded,
    isSignedIn,
  } = useAuth();

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ===================================================
  // ADD MODAL
  // ===================================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  // ===================================================
  // EDIT MODAL
  // ===================================================

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  // ===================================================
  // ADD FORM
  // ===================================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  department: "",
    isActive: true,
  });

  // ===================================================
  // EDIT FORM
  // ===================================================

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  department: "",
    isActive: true,
  });

  // ===================================================
  // SELECTION
  // ===================================================

  const [selectedUsers, setSelectedUsers] =
    useState([]);

  // ===================================================
  // FETCH USERS
  // ===================================================

  const fetchUsers = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      const response = await axios.get(
        `${API_URL}/api/users`,
        {
          params: {
            limit: 100,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const fetchedUsers =
        response.data?.data || [];

      setUsers(
        Array.isArray(fetchedUsers)
          ? fetchedUsers
          : []
      );

      setSelectedUsers([]);
    } catch (err) {
      console.error(
        "FETCH USERS ERROR:",
        err
      );

      setUsers([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch users."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);

      setError(
        "Please login to access User Management."
      );

      return;
    }

    fetchUsers();
  }, [isLoaded, isSignedIn]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleFormChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ===================================================
  // EDIT FORM CHANGE
  // ===================================================

  const handleEditFormChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    setError("");
    setMessage("");

  setForm({
  name: "",
  email: "",
  phone: "",
  role: "",
  department: "",
  isActive: true,
});

    setShowAddModal(true);
  };

  // ===================================================
  // OPEN ADD MODAL FROM A LINK
  // /admin/users?add=staff opens the form with the
  // role already selected.
  // ===================================================

  useEffect(() => {
    const role = new URLSearchParams(
      window.location.search
    ).get("add");

    if (!role) return;

    openAddModal();

    setForm((previous) => ({
      ...previous,
      role,
    }));
  }, []);

  // ===================================================
  // CLOSE ADD MODAL
  // ===================================================

  const closeAddModal = () => {
    if (saving) return;

    setShowAddModal(false);

   setForm({
  name: "",
  email: "",
  phone: "",
  role: "",
  department: "",
  isActive: true,
});
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (user) => {
    setError("");
    setMessage("");

    setEditingUser(user);

    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      isActive:
        user.isActive === true,
    });

    setShowEditModal(true);
  };

  // ===================================================
  // CLOSE EDIT MODAL
  // ===================================================

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
    setEditingUser(null);

    setEditForm({
      name: "",
      email: "",
      phone: "",
      role: "",
      isActive: true,
    });
  };

  // ===================================================
  // CREATE USER
  // ===================================================

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.role) {
      setError("Please select a role.");
      return;
    }
if (!form.department) {
  setError("Please select a department.");
  return;
}
    try {
      setSaving(true);

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

     const payload = {
  name: form.name.trim(),
  email: form.email.trim().toLowerCase(),
  phone: form.phone.trim(),
  role: form.role,
  department: form.department,
  isActive: Boolean(form.isActive),
};

      const response = await axios.post(
        `${API_URL}/api/users`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const createdUser =
        response.data?.data;

      setMessage(
        response.data?.message ||
          "User created successfully."
      );

      setShowAddModal(false);

      setForm({
        name: "",
        email: "",
        phone: "",
        role: "",
        isActive: true,
      });

      if (createdUser) {
        setUsers((previous) => [
          createdUser,
          ...previous,
        ]);
      } else {
        await fetchUsers();
      }
    } catch (err) {
      console.error(
        "CREATE USER ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // UPDATE USER
  // ===================================================

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    if (!editingUser?._id) {
      setError("User ID is missing.");
      return;
    }

    setError("");
    setMessage("");

    if (!editForm.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!editForm.role) {
      setError("Please select a role.");
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      const payload = {
        name: editForm.name.trim(),

        email: editForm.email
          .trim()
          .toLowerCase(),

        phone: editForm.phone.trim(),

        role: editForm.role,

        isActive: Boolean(
          editForm.isActive
        ),
      };

      const response = await axios.put(
        `${API_URL}/api/users/${editingUser._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const updatedUser =
        response.data?.data;

      setMessage(
        response.data?.message ||
          "User updated successfully."
      );

      setShowEditModal(false);
      setEditingUser(null);

      if (updatedUser) {
        setUsers((previous) =>
          previous.map((user) =>
            String(user._id) ===
            String(updatedUser._id)
              ? updatedUser
              : user
          )
        );
      } else {
        await fetchUsers();
      }
    } catch (err) {
      console.error(
        "UPDATE USER ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE ONE USER
  // ===================================================

  const handleDeleteUser = async (user) => {
    if (!user?._id) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${user.name}"?\n\nThis will delete the user from Clerk and MongoDB.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      const response = await axios.delete(
        `${API_URL}/api/users/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data?.message ||
          "User deleted successfully."
      );

      setUsers((previous) =>
        previous.filter(
          (item) =>
            String(item._id) !==
            String(user._id)
        )
      );

      setSelectedUsers((previous) =>
        previous.filter(
          (id) =>
            String(id) !==
            String(user._id)
        )
      );
    } catch (err) {
      console.error(
        "DELETE USER ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete user."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===================================================
  // DELETE SELECTED USERS
  // ===================================================

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      return;
    }

    const selectedObjects = users.filter(
      (user) =>
        selectedUsers.includes(
          String(user._id)
        )
    );

    const names = selectedObjects
      .slice(0, 5)
      .map((user) => user.name)
      .join(", ");

    const extra =
      selectedObjects.length > 5
        ? ` and ${
            selectedObjects.length - 5
          } more`
        : "";

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${selectedObjects.length} selected user(s)?\n\n${names}${extra}\n\nThis will delete the selected users from Clerk and MongoDB.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      /*
       * Delete one by one through the existing
       * DELETE /api/users/:id endpoint.
       *
       * This keeps the frontend compatible with
       * the existing backend deleteUser controller.
       */
      const results = [];

      for (const id of selectedUsers) {
        try {
          const response =
            await axios.delete(
              `${API_URL}/api/users/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          results.push({
            id,
            success: true,
            message:
              response.data?.message,
          });
        } catch (deleteError) {
          results.push({
            id,
            success: false,
            message:
              deleteError.response?.data
                ?.message ||
              deleteError.message,
          });
        }
      }

      const successfulIds =
        results
          .filter(
            (result) => result.success
          )
          .map((result) => result.id);

      const failed =
        results.filter(
          (result) => !result.success
        );

      if (successfulIds.length > 0) {
        setUsers((previous) =>
          previous.filter(
            (user) =>
              !successfulIds.includes(
                String(user._id)
              )
          )
        );
      }

      setSelectedUsers([]);

      if (failed.length === 0) {
        setMessage(
          `${successfulIds.length} user(s) deleted successfully from Clerk and MongoDB.`
        );
      } else {
        setError(
          `${successfulIds.length} user(s) deleted. ${failed.length} user(s) could not be deleted.`
        );
      }
    } catch (err) {
      console.error(
        "DELETE SELECTED USERS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete selected users."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===================================================
  // FILTER USERS
  // ===================================================

  const filteredUsers = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return [...users]
      .filter((user) => {
        const matchesSearch =
          !searchText ||
          String(user.name || "")
            .toLowerCase()
            .includes(searchText) ||
          String(user.email || "")
            .toLowerCase()
            .includes(searchText) ||
          String(user.phone || "")
            .toLowerCase()
            .includes(searchText) ||
          String(user.clerkUserId || "")
            .toLowerCase()
            .includes(searchText);

        const matchesRole =
          !roleFilter ||
          user.role === roleFilter;

        const matchesStatus =
          !statusFilter ||
          (statusFilter === "active"
            ? user.isActive === true
            : user.isActive === false);

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || ""),
          undefined,
          {
            sensitivity: "base",
          }
        )
      );
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  // ===================================================
  // COUNTS
  // ===================================================

  const totalCount = users.length;

  const activeCount = users.filter(
    (user) => user.isActive
  ).length;

  const inactiveCount = users.filter(
    (user) => !user.isActive
  ).length;

  // ===================================================
  // SELECTION
  // ===================================================

  const filteredIds = filteredUsers.map(
    (user) => String(user._id)
  );

  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) =>
      selectedUsers.includes(id)
    );

  const someFilteredSelected =
    filteredIds.some((id) =>
      selectedUsers.includes(id)
    );

  const toggleUserSelection = (userId) => {
    const id = String(userId);

    setSelectedUsers((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (item) => item !== id
        );
      }

      return [...previous, id];
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedUsers((previous) =>
        previous.filter(
          (id) => !filteredIds.includes(id)
        )
      );

      return;
    }

    setSelectedUsers((previous) => [
      ...new Set([
        ...previous,
        ...filteredIds,
      ]),
    ]);
  };

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading &&
    users.length === 0
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />

          <p className="mt-4 text-sm text-slate-500">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                User Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage application users and their access roles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {selectedUsers.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={17} />

              {deleting
                ? "Deleting..."
                : `Delete Selected (${selectedUsers.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              fetchUsers(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            <UserPlus size={18} />

            Add User
          </button>
        </div>
      </div>

      {/* SUCCESS */}
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{message}</span>

          <button
            type="button"
            onClick={() =>
              setMessage("")
            }
            className="ml-auto rounded-lg p-1 hover:bg-green-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="ml-auto rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Users"
          value={totalCount}
          icon={<Users size={21} />}
          iconClass="bg-amber-50 text-amber-700"
        />

        <StatCard
          title="Active Users"
          value={activeCount}
          icon={
            <ShieldCheck size={21} />
          }
          iconClass="bg-green-50 text-green-700"
        />

        <StatCard
          title="Inactive Users"
          value={inactiveCount}
          icon={
            <ShieldOff size={21} />
          }
          iconClass="bg-red-50 text-red-700"
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px_auto]">

          {/* SEARCH */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search name, email, phone or Clerk ID..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* ROLE */}
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
          >
            <option value="">
              All Roles
            </option>

            {ROLES.map((role) => (
              <option
                key={role.value}
                value={role.value}
              >
                {role.label}
              </option>
            ))}
          </select>


          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
          >
            <option value="">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          {/* CLEAR */}
          <button
            type="button"
            onClick={clearFilters}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            Clear
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredUsers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {users.length}
            </span>{" "}
            users
          </span>

          {selectedUsers.length > 0 && (
            <span className="font-semibold text-amber-700">
              {selectedUsers.length} selected
            </span>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-[1250px] w-full">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">

                {/* SELECT */}
                <th className="w-12 px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    title={
                      allFilteredSelected
                        ? "Unselect all"
                        : "Select all"
                    }
                    className="inline-flex items-center justify-center text-slate-500 hover:text-amber-600"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare
                        size={18}
                        className="text-amber-600"
                      />
                    ) : someFilteredSelected ? (
                      <div className="relative">
                        <Square
                          size={18}
                          className="text-amber-600"
                        />

                        <Check
                          size={11}
                          className="absolute left-[3px] top-[3px] text-amber-600"
                        />
                      </div>
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>

                {/* SERIAL */}
                <th className="w-16 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sl.
                </th>

                {/* USER */}
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  User
                </th>

                {/* CONTACT */}
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>
<th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
  Department
</th>
                {/* ROLE */}
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>

                {/* STATUS */}
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                {/* CLERK */}
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Clerk ID
                </th>

                {/* CREATED */}
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>

                {/* ACTIONS */}
                <th className="w-28 px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Users size={25} />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      No users found
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Try changing the search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(
                  (user, index) => {
                    const roleInfo =
                      getRoleStyle(
                        user.role
                      );

                    const RoleIcon =
                      roleInfo.icon;

                    const userId =
                      String(
                        user._id
                      );

                    const selected =
                      selectedUsers.includes(
                        userId
                      );

                    return (
                      <tr
                        key={
                          user._id ||
                          user.clerkUserId
                        }
                        className={`transition ${
                          selected
                            ? "bg-amber-50/50"
                            : "hover:bg-slate-50"
                        }`}
                      >

                        {/* CHECKBOX */}
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toggleUserSelection(
                                user._id
                              )
                            }
                            className="inline-flex items-center justify-center"
                          >
                            {selected ? (
                              <CheckSquare
                                size={19}
                                className="text-amber-600"
                              />
                            ) : (
                              <Square
                                size={19}
                                className="text-slate-400 hover:text-amber-500"
                              />
                            )}
                          </button>
                        </td>

                        {/* SERIAL */}
                        <td className="px-4 py-4 text-center text-sm font-medium text-slate-500">
                          {index + 1}
                        </td>

                        {/* USER */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-700">
                              {getInitials(
                                user.name
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {user.name ||
                                  "-"}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {user.email ||
                                  "-"}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">

                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail
                                size={14}
                                className="text-slate-400"
                              />

                              <span>
                                {user.email ||
                                  "-"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone
                                size={14}
                                className="text-slate-400"
                              />

                              <span>
                                {user.phone ||
                                  "No phone"}
                              </span>
                            </div>

                          </div>
                        </td>
<td className="px-5 py-4">
  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
    {user.department || "-"}
  </span>
</td>
                        {/* ROLE */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${roleInfo.className}`}
                          >
                            <RoleIcon
                              size={14}
                            />

                            {roleInfo.label}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* CLERK ID */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-slate-500">
                            {user.clerkUserId ||
                              "-"}
                          </span>
                        </td>

                        {/* CREATED */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            user.createdAt
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">

                            {/* EDIT */}
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  user
                                )
                              }
                              disabled={
                                deleting ||
                                saving
                              }
                              title="Edit user"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteUser(
                                  user
                                )
                              }
                              disabled={
                                deleting ||
                                saving
                              }
                              title="Delete user"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>
          </table>

        </div>
      </div>

      {/* =================================================
          ADD USER MODAL
      ================================================= */}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Add New User
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  A Clerk account and MongoDB user will be created.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeAddModal
                }
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={
                handleCreateUser
              }
              className="space-y-5 p-6"
            >

              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <User
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Enter full name"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Enter email address"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Enter phone number"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* ROLE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  name="role"
                  value={form.role}
                  onChange={
                    handleFormChange
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">
                    Select role
                  </option>

                  {ROLES.map(
                    (role) => (
                      <option
                        key={
                          role.value
                        }
                        value={
                          role.value
                        }
                      >
                        {role.label}
                      </option>
                    )
                  )}
                </select>
              </div>
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Department
    <span className="ml-1 text-red-500">*</span>
  </label>

  <select
    name="department"
    value={form.department}
    onChange={handleFormChange}
    disabled={saving}
    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
  >
    <option value="">
      Select department
    </option>

    {DEPARTMENTS.map((department) => (
      <option
        key={department.value}
        value={department.value}
      >
        {department.label}
      </option>
    ))}
  </select>
</div>
              {/* ACTIVE */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={
                      form.isActive
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={saving}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Active User
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Allow this user to access the application.
                    </p>
                  </div>

                </label>
              </div>

              {/* BUTTONS */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={
                    closeAddModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus
                        size={17}
                      />

                      Create User
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================
          EDIT USER MODAL
      ================================================= */}

      {showEditModal &&
        editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Edit User
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Update user details and access role.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeEditModal
                  }
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={20} />
                </button>

              </div>

              {/* FORM */}
              <form
                onSubmit={
                  handleUpdateUser
                }
                className="space-y-5 p-6"
              >

                {/* NAME */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      editForm.name
                    }
                    onChange={
                      handleEditFormChange
                    }
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      editForm.email
                    }
                    onChange={
                      handleEditFormChange
                    }
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Email is synchronized with the Clerk account.
                  </p>
                </div>

                {/* PHONE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={
                      editForm.phone
                    }
                    onChange={
                      handleEditFormChange
                    }
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                {/* ROLE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="role"
                    value={
                      editForm.role
                    }
                    onChange={
                      handleEditFormChange
                    }
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">
                      Select role
                    </option>

                    {ROLES.map(
                      (role) => (
                        <option
                          key={
                            role.value
                          }
                          value={
                            role.value
                          }
                        >
                          {role.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Department
    <span className="ml-1 text-red-500">*</span>
  </label>

  <select
    name="department"
    value={editForm.department}
    onChange={handleEditFormChange}
    disabled={saving}
    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
  >
    <option value="">
      Select department
    </option>

    {DEPARTMENTS.map((department) => (
      <option
        key={department.value}
        value={department.value}
      >
        {department.label}
      </option>
    ))}
  </select>
</div>
                {/* ACTIVE */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-center gap-3">

                    <input
                      type="checkbox"
                      name="isActive"
                      checked={
                        editForm.isActive
                      }
                      onChange={
                        handleEditFormChange
                      }
                      disabled={saving}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Active User
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Allow this user to access the application.
                      </p>
                    </div>

                  </label>
                </div>

                {/* BUTTONS */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">

                  <button
                    type="button"
                    onClick={
                      closeEditModal
                    }
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <RefreshCw
                          size={17}
                          className="animate-spin"
                        />

                        Saving...
                      </>
                    ) : (
                      <>
                        <Check
                          size={17}
                        />

                        Save Changes
                      </>
                    )}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  title,
  value,
  icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

// =====================================================
// INITIALS
// =====================================================

function getInitials(name = "") {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}