import api from "../../api";

// =========================================================
// GET EMPLOYEES
// =========================================================

export async function getAdminUsers({
  search = "",
  departmentId = "",
  role = "",
  isActive = "",
  page = 1,
  pageSize = 20,
} = {}) {
  const response = await api.get("/admin/employees", {
    params: {
      search: search || undefined,
      departmentId: departmentId !== "" ? departmentId : undefined,
      role: role || undefined,
      isActive: isActive !== "" ? isActive : undefined,
      page,
      pageSize,
    },
  });

  return response.data;
}

// =========================================================
// GET EMPLOYEE DETAIL
// =========================================================

export async function getAdminUser(id) {
  const response = await api.get(`/admin/employees/${id}`);

  return response.data;
}

// =========================================================
// CREATE EMPLOYEE
// =========================================================

export async function createEmployee(data) {
  const response = await api.post("/admin/employees", data);

  return response.data;
}

// =========================================================
// UPDATE EMPLOYEE
// =========================================================

export async function updateEmployee(id, data) {
  const response = await api.put(`/admin/employees/${id}`, data);

  return response.data;
}

// =========================================================
// ACTIVE / INACTIVE
// =========================================================

export async function updateUserActive(id, active) {
  const response = await api.patch(`/admin/employees/${id}/active`, {
    active,
  });

  return response.data;
}

// =========================================================
// CHANGE ROLE
// =========================================================

export async function updateUserRole(id, role) {
  const response = await api.patch(`/admin/employees/${id}/role`, {
    role,
  });

  return response.data;
}

// =========================================================
// CHANGE DEPARTMENT
// =========================================================

export async function updateUserDepartment(id, departmentId) {
  const response = await api.patch(
    `/admin/employees/${id}/department`,
    departmentId,
  );

  return response.data;
}

// =========================================================
// RESET PASSWORD
// =========================================================

export async function resetEmployeePassword(id, newPassword) {
  const response = await api.patch(`/admin/employees/${id}/reset-password`, {
    newPassword,
  });

  return response.data;
}

// =========================================================
// DELETE EMPLOYEE
// =========================================================

export async function deleteAdminUser(id) {
  const response = await api.delete(`/admin/employees/${id}`);

  return response.data;
}
