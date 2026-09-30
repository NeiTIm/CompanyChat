import api from "../api";

/* =========================================================
   USER SERVICE
========================================================= */

/**
 * Lấy danh sách tất cả user
 */
export async function getUsers() {
  const response =
    await api.get("/users");

  return response.data;
}