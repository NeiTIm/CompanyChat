import api from "../../api";

export async function getAdminDepartments() {
  const response = await api.get("/admin/departments");

  return response.data;
}