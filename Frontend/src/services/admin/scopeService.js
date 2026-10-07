import api from "../../api";

/* =========================================================
   DIRECT SCOPE
   Backend:
   /api/admin/scopes
========================================================= */

const BASE_URL = "/admin/scopes";

/* =========================================================
   GROUP SCOPE
   Backend:
   /api/admin/group-scopes
========================================================= */

const GROUP_SCOPE_BASE_URL = "/admin/group-scopes";

/* =========================================================
   DIRECT SCOPE
   GET USERS FOR SCOPE MANAGEMENT

   GET /api/admin/scopes/users
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
   DIRECT SCOPE
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
   DIRECT SCOPE
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
   DIRECT SCOPE
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
   DIRECT SCOPE
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
   DIRECT SCOPE
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
   DIRECT SCOPE
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
   DIRECT SCOPE
   GET DEPARTMENTS WITH SCOPE COUNT

   GET /api/admin/scopes/departments
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
   DIRECT SCOPE
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
   DIRECT SCOPE
   GET SCOPE STATISTICS

   GET /api/admin/scopes/statistics
========================================================= */

export const getScopeStatistics = async () => {
  const response = await api.get(`${BASE_URL}/statistics`);

  return response.data;
};

/* =========================================================
   =========================================================
   GROUP SCOPE
   =========================================================
   ========================================================= */

/* =========================================================
   GROUP SCOPE
   GET ALL GROUP SCOPES

   GET /api/admin/group-scopes
========================================================= */

export const getGroupScopes = async () => {
  const response = await api.get(GROUP_SCOPE_BASE_URL);

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   GET GROUP SCOPE DETAIL

   GET /api/admin/group-scopes/{scopeGroupId}
========================================================= */

export const getGroupScope = async (scopeGroupId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  const response = await api.get(`${GROUP_SCOPE_BASE_URL}/${scopeGroupId}`);

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   CREATE GROUP SCOPE

   POST /api/admin/group-scopes

   Body:
   {
     name,
     description
   }
========================================================= */

export const createGroupScope = async (name, description = "") => {
  if (!name?.trim()) {
    throw new Error("name is required.");
  }

  const response = await api.post(GROUP_SCOPE_BASE_URL, {
    name: name.trim(),
    description: description?.trim() || "",
  });

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   UPDATE GROUP SCOPE

   PUT /api/admin/group-scopes/{scopeGroupId}

   Body:
   {
     name,
     description
   }
========================================================= */

export const updateGroupScope = async (
  scopeGroupId,
  name,
  description = "",
) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  if (!name?.trim()) {
    throw new Error("name is required.");
  }

  const response = await api.put(`${GROUP_SCOPE_BASE_URL}/${scopeGroupId}`, {
    name: name.trim(),
    description: description?.trim() || "",
  });

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   DELETE GROUP SCOPE

   DELETE /api/admin/group-scopes/{scopeGroupId}
========================================================= */

export const deleteGroupScope = async (scopeGroupId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  const response = await api.delete(`${GROUP_SCOPE_BASE_URL}/${scopeGroupId}`);

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   GET USERS

   GET /api/admin/group-scopes/{scopeGroupId}/users
========================================================= */

export const getGroupScopeUsers = async (scopeGroupId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  const response = await api.get(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/users`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   CHECK USER

   GET
   /api/admin/group-scopes/{scopeGroupId}/users/{userId}
========================================================= */

export const hasGroupScopeUser = async (scopeGroupId, userId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  if (!userId) {
    throw new Error("userId is required.");
  }

  const response = await api.get(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/users/${userId}`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   ASSIGN USER

   POST
   /api/admin/group-scopes/{scopeGroupId}/users/{userId}
========================================================= */

export const assignGroupScopeUser = async (scopeGroupId, userId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  if (!userId) {
    throw new Error("userId is required.");
  }

  const response = await api.post(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/users/${userId}`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   REMOVE USER

   DELETE
   /api/admin/group-scopes/{scopeGroupId}/users/{userId}
========================================================= */

export const removeGroupScopeUser = async (scopeGroupId, userId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  if (!userId) {
    throw new Error("userId is required.");
  }

  const response = await api.delete(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/users/${userId}`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   GET DEPARTMENTS

   GET /api/admin/group-scopes/{scopeGroupId}/departments
========================================================= */

export const getGroupScopeDepartments = async (scopeGroupId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  const response = await api.get(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/departments`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   CHECK DEPARTMENT

   GET
   /api/admin/group-scopes/{scopeGroupId}/departments/{departmentId}
========================================================= */

export const hasGroupScopeDepartment = async (scopeGroupId, departmentId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  if (!departmentId) {
    throw new Error("departmentId is required.");
  }

  const response = await api.get(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/departments/${departmentId}`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   ASSIGN DEPARTMENT

   POST
   /api/admin/group-scopes/{scopeGroupId}/departments/{departmentId}
========================================================= */

export const assignGroupScopeDepartment = async (
  scopeGroupId,
  departmentId,
) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  if (!departmentId) {
    throw new Error("departmentId is required.");
  }

  const response = await api.post(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/departments/${departmentId}`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   REMOVE DEPARTMENT

   DELETE
   /api/admin/group-scopes/{scopeGroupId}/departments/{departmentId}
========================================================= */

export const removeGroupScopeDepartment = async (
  scopeGroupId,
  departmentId,
) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  if (!departmentId) {
    throw new Error("departmentId is required.");
  }

  const response = await api.delete(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/departments/${departmentId}`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   CHECK EFFECTIVE SCOPE

   GET
   /api/admin/group-scopes/{scopeGroupId}/users/{userId}/effective
========================================================= */

export const hasEffectiveGroupScope = async (scopeGroupId, userId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  if (!userId) {
    throw new Error("userId is required.");
  }

  const response = await api.get(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/users/${userId}/effective`,
  );

  return response.data;
};

/* =========================================================
   GROUP SCOPE
   GET EFFECTIVE USERS

   GET
   /api/admin/group-scopes/{scopeGroupId}/effective-users
========================================================= */

export const getGroupScopeEffectiveUsers = async (scopeGroupId) => {
  if (!scopeGroupId) {
    throw new Error("scopeGroupId is required.");
  }

  const response = await api.get(
    `${GROUP_SCOPE_BASE_URL}/${scopeGroupId}/effective-users`,
  );

  return response.data;
};

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const scopeService = {
  /* =======================================================
     DIRECT SCOPE
  ======================================================= */

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

  /* =======================================================
     GROUP SCOPE
  ======================================================= */

  getGroupScopes,
  getGroupScope,

  createGroupScope,
  updateGroupScope,
  deleteGroupScope,

  getGroupScopeUsers,
  hasGroupScopeUser,
  assignGroupScopeUser,
  removeGroupScopeUser,

  getGroupScopeDepartments,
  hasGroupScopeDepartment,
  assignGroupScopeDepartment,
  removeGroupScopeDepartment,

  hasEffectiveGroupScope,
  getGroupScopeEffectiveUsers,
};

export default scopeService;
