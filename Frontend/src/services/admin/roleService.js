import api from "../../api";

/* =========================================================
   ROLE LIST
   GET /api/admin/roles
========================================================= */

export async function getRoles({
  search = "",
  systemOnly = null,
  roleName = "",
  page = 1,
  pageSize = 10,
} = {}) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.append("search", search.trim());
  }

  if (systemOnly !== null && systemOnly !== undefined) {
    params.append("systemOnly", String(systemOnly));
  }

  if (roleName?.trim()) {
    params.append("roleName", roleName.trim());
  }

  params.append("page", String(page));

  params.append("pageSize", String(pageSize));

  const queryString = params.toString();

  const response = await api.get(`/admin/roles?${queryString}`);

  return response.data;
}

/* =========================================================
   ROLE DETAIL
   GET /api/admin/roles/{id}
========================================================= */

export async function getRole(roleId) {
  const response = await api.get(`/admin/roles/${roleId}`);

  return response.data;
}

/* =========================================================
   CREATE ROLE
   POST /api/admin/roles
========================================================= */

export async function createRole(data) {
  const response = await api.post("/admin/roles", data);

  return response.data;
}

/* =========================================================
   UPDATE ROLE
   PUT /api/admin/roles/{id}
========================================================= */

export async function updateRole(roleId, data) {
  const response = await api.put(`/admin/roles/${roleId}`, data);

  return response.data;
}

/* =========================================================
   DELETE ROLE
   DELETE /api/admin/roles/{id}
========================================================= */

export async function deleteRole(roleId) {
  const response = await api.delete(`/admin/roles/${roleId}`);

  return response.data;
}

/* =========================================================
   ROLE PERMISSIONS
   GET /api/admin/roles/{id}/permissions
========================================================= */

export async function getRolePermissions(roleId) {
  const response = await api.get(`/admin/roles/${roleId}/permissions`);

  return response.data;
}

/* =========================================================
   UPDATE ROLE PERMISSIONS
   PUT /api/admin/roles/{id}/permissions
========================================================= */

export async function updateRolePermissions(roleId, permissionIds) {
  const response = await api.put(`/admin/roles/${roleId}/permissions`, {
    permissionIds,
  });

  return response.data;
}

/* =========================================================
   ADD PERMISSION TO ROLE
   POST /api/admin/roles/{id}/permissions/{permissionId}
========================================================= */

export async function addPermissionToRole(roleId, permissionId) {
  const response = await api.post(
    `/admin/roles/${roleId}/permissions/${permissionId}`,
  );

  return response.data;
}

/* =========================================================
   REMOVE PERMISSION FROM ROLE
   DELETE /api/admin/roles/{id}/permissions/{permissionId}
========================================================= */

export async function removePermissionFromRole(roleId, permissionId) {
  const response = await api.delete(
    `/admin/roles/${roleId}/permissions/${permissionId}`,
  );

  return response.data;
}

/* =========================================================
   AVAILABLE PERMISSIONS
   GET /api/admin/roles/{id}/available-permissions
========================================================= */

export async function getAvailablePermissions(roleId) {
  const response = await api.get(
    `/admin/roles/${roleId}/available-permissions`,
  );

  return response.data;
}

/* =========================================================
   ROLE USERS
   GET /api/admin/roles/{id}/users
========================================================= */

export async function getRoleUsers(
  roleId,
  { search = "", page = 1, pageSize = 20 } = {},
) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.append("search", search.trim());
  }

  params.append("page", String(page));

  params.append("pageSize", String(pageSize));

  const response = await api.get(
    `/admin/roles/${roleId}/users?${params.toString()}`,
  );

  return response.data;
}
