import api from "../../api";

/* =========================================================
   SCOPE SERVICE

   Backend:
   /api/admin/scopes
========================================================= */

const BASE_URL = "/admin/scopes";

/* =========================================================
   GET USERS FOR SCOPE MANAGEMENT

   GET /api/admin/scopes/users

   Params:
   - search
   - role
   - departmentId
   - page
   - pageSize
========================================================= */

export const getScopeUsers = async ({
  search = "",
  role = "",
  departmentId = null,
  page = 1,
  pageSize = 20,
} = {}) => {
  const response = await api.get(`${BASE_URL}/users`, {
    params: {
      search: search || undefined,
      role: role || undefined,
      departmentId: departmentId || undefined,
      page,
      pageSize,
    },
  });

  return response.data;
};

/* =========================================================
   GET USER SCOPE DETAIL

   GET /api/admin/scopes/users/{userId}
========================================================= */

export const getUserScope = async (userId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  const response = await api.get(`${BASE_URL}/users/${userId}`);

  return response.data;
};

/* =========================================================
   GET AVAILABLE DEPARTMENTS

   GET
   /api/admin/scopes/users/{userId}/available-departments
========================================================= */

export const getAvailableDepartments = async (userId, search = "") => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  const response = await api.get(
    `${BASE_URL}/users/${userId}/available-departments`,
    {
      params: {
        search: search || undefined,
      },
    },
  );

  return response.data;
};

/* =========================================================
   ASSIGN ONE DEPARTMENT

   POST
   /api/admin/scopes/users/{userId}/departments/{departmentId}
========================================================= */

export const assignDepartmentScope = async (userId, departmentId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  if (!departmentId) {
    throw new Error("departmentId is required.");
  }

  const response = await api.post(
    `${BASE_URL}/users/${userId}/departments/${departmentId}`,
  );

  return response.data;
};

/* =========================================================
   REMOVE ONE DEPARTMENT

   DELETE
   /api/admin/scopes/users/{userId}/departments/{departmentId}
========================================================= */

export const removeDepartmentScope = async (userId, departmentId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  if (!departmentId) {
    throw new Error("departmentId is required.");
  }

  const response = await api.delete(
    `${BASE_URL}/users/${userId}/departments/${departmentId}`,
  );

  return response.data;
};

/* =========================================================
   BULK ASSIGN

   POST
   /api/admin/scopes/users/{userId}/departments/bulk
========================================================= */

export const bulkAssignDepartments = async (userId, departmentIds = []) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  if (!Array.isArray(departmentIds)) {
    throw new Error("departmentIds must be an array.");
  }

  const response = await api.post(
    `${BASE_URL}/users/${userId}/departments/bulk`,
    {
      departmentIds,
    },
  );

  return response.data;
};

/* =========================================================
   REPLACE ALL USER SCOPES

   PUT
   /api/admin/scopes/users/{userId}
========================================================= */

export const replaceUserScopes = async (userId, departmentIds = []) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  if (!Array.isArray(departmentIds)) {
    throw new Error("departmentIds must be an array.");
  }

  const response = await api.put(`${BASE_URL}/users/${userId}`, {
    departmentIds,
  });

  return response.data;
};

/* =========================================================
   GET DEPARTMENTS WITH SCOPE COUNT

   GET /api/admin/scopes/departments

   Params:
   - search
   - page
   - pageSize
========================================================= */

export const getScopeDepartments = async ({
  search = "",
  page = 1,
  pageSize = 20,
} = {}) => {
  const response = await api.get(`${BASE_URL}/departments`, {
    params: {
      search: search || undefined,
      page,
      pageSize,
    },
  });

  return response.data;
};

/* =========================================================
   GET USERS BY DEPARTMENT

   GET
   /api/admin/scopes/departments/{departmentId}/users
========================================================= */

export const getUsersByDepartmentScope = async (departmentId) => {
  if (!departmentId) {
    throw new Error("departmentId is required.");
  }

  const response = await api.get(
    `${BASE_URL}/departments/${departmentId}/users`,
  );

  return response.data;
};

/* =========================================================
   GET SCOPE STATISTICS

   GET /api/admin/scopes/statistics
========================================================= */

export const getScopeStatistics = async () => {
  const response = await api.get(`${BASE_URL}/statistics`);

  return response.data;
};

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const scopeService = {
  getScopeUsers,
  getUserScope,
  getAvailableDepartments,

  assignDepartmentScope,
  removeDepartmentScope,

  bulkAssignDepartments,
  replaceUserScopes,

  getScopeDepartments,
  getUsersByDepartmentScope,

  getScopeStatistics,
};

export default scopeService;
