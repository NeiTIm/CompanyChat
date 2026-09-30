import api from "../../api";

export async function getAdminUsers() {
  const response = await api.get("/admin/users");
  return response.data;
}

export async function getAdminUser(id) {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
}

export async function updateUserActive(id, active) {
  await api.patch(`/admin/users/${id}/active`, active);
}

export async function updateUserRole(id, role) {
  const response = await api.patch(
    `/admin/users/${id}/role`,
    {
      role,
    }
  );

  return response.data;
}

export async function deleteAdminUser(id) {
  await api.delete(`/admin/users/${id}`);
}