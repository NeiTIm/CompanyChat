import api from "../../api";

/* =========================================================
   DEPARTMENT LIST
========================================================= */

/**
 * Get departments with search, status filter and pagination.
 *
 * @param {Object} options
 * @param {string} options.search
 * @param {boolean|null} options.isActive
 * @param {number} options.page
 * @param {number} options.pageSize
 */
export async function getDepartments({
  search = "",
  isActive = null,
  page = 1,
  pageSize = 10,
} = {}) {
  const params = {
    page,
    pageSize,
  };

  if (search?.trim()) {
    params.search = search.trim();
  }

  if (isActive !== null && isActive !== undefined) {
    params.isActive = isActive;
  }

  const response = await api.get("/admin/departments", {
    params,
  });

  return response.data;
}

/* =========================================================
   DEPARTMENT DETAIL
========================================================= */

/**
 * Get department detail.
 *
 * @param {number} departmentId
 */
export async function getDepartment(departmentId) {
  const response = await api.get(`/admin/departments/${departmentId}`);

  return response.data;
}

/* =========================================================
   CREATE DEPARTMENT
========================================================= */

/**
 * Create a new department.
 *
 * Backend:
 * POST /api/admin/departments
 *
 * Body:
 * {
 *   name: string,
 *   description: string
 * }
 *
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.description
 */
export async function createDepartment(data) {
  const response = await api.post("/admin/departments", {
    name: data.name,
    description: data.description ?? "",
  });

  return response.data;
}

/* =========================================================
   UPDATE DEPARTMENT
========================================================= */

/**
 * Update department information.
 *
 * Backend:
 * PUT /api/admin/departments/{id}
 *
 * Body:
 * {
 *   name: string,
 *   description: string
 * }
 *
 * @param {number} departmentId
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.description
 */
export async function updateDepartment(departmentId, data) {
  const response = await api.put(`/admin/departments/${departmentId}`, {
    name: data.name,
    description: data.description ?? "",
  });

  return response.data;
}

/* =========================================================
   ACTIVE / INACTIVE
========================================================= */

/**
 * Enable or disable department.
 *
 * Backend expects:
 * UpdateDepartmentStatusDto
 *
 * Body:
 * {
 *   isActive: boolean
 * }
 *
 * @param {number} departmentId
 * @param {boolean} isActive
 */
export async function updateDepartmentStatus(departmentId, isActive) {
  const response = await api.patch(
    `/admin/departments/${departmentId}/active`,
    {
      isActive,
    },
  );

  return response.data;
}

/* =========================================================
   MEMBERS
========================================================= */

/**
 * Get department members.
 *
 * @param {number} departmentId
 * @param {Object} options
 * @param {string} options.search
 * @param {number} options.page
 * @param {number} options.pageSize
 */
export async function getDepartmentMembers(
  departmentId,
  { search = "", page = 1, pageSize = 20 } = {},
) {
  const params = {
    page,
    pageSize,
  };

  if (search?.trim()) {
    params.search = search.trim();
  }

  const response = await api.get(`/admin/departments/${departmentId}/members`, {
    params,
  });

  return response.data;
}

/* =========================================================
   AVAILABLE MEMBERS
========================================================= */

/**
 * Get employees available to add to department.
 *
 * @param {number} departmentId
 * @param {Object} options
 * @param {string} options.search
 * @param {number} options.page
 * @param {number} options.pageSize
 */
export async function getAvailableDepartmentMembers(
  departmentId,
  { search = "", page = 1, pageSize = 20 } = {},
) {
  const params = {
    page,
    pageSize,
  };

  if (search?.trim()) {
    params.search = search.trim();
  }

  const response = await api.get(
    `/admin/departments/${departmentId}/available-members`,
    {
      params,
    },
  );

  return response.data;
}

/* =========================================================
   ADD ONE MEMBER
========================================================= */

/**
 * Add one employee to department.
 *
 * Backend:
 * POST /api/admin/departments/{id}/members
 *
 * Body:
 * {
 *   userId: number
 * }
 *
 * @param {number} departmentId
 * @param {number} userId
 */
export async function addDepartmentMember(departmentId, userId) {
  const response = await api.post(
    `/admin/departments/${departmentId}/members`,
    {
      userId,
    },
  );

  return response.data;
}

/* =========================================================
   REMOVE ONE MEMBER
========================================================= */

/**
 * Remove one employee from department.
 *
 * @param {number} departmentId
 * @param {number} userId
 */
export async function removeDepartmentMember(departmentId, userId) {
  const response = await api.delete(
    `/admin/departments/${departmentId}/members/${userId}`,
  );

  return response.data;
}

/* =========================================================
   BULK ADD MEMBERS
========================================================= */

/**
 * Add multiple employees to department.
 *
 * Backend:
 * POST /api/admin/departments/{id}/members/bulk
 *
 * Body:
 * {
 *   userIds: number[]
 * }
 *
 * @param {number} departmentId
 * @param {number[]} userIds
 */
export async function bulkAddDepartmentMembers(departmentId, userIds) {
  const response = await api.post(
    `/admin/departments/${departmentId}/members/bulk`,
    {
      userIds,
    },
  );

  return response.data;
}

/* =========================================================
   BULK REMOVE MEMBERS
========================================================= */

/**
 * Remove multiple employees from department.
 *
 * Backend:
 * DELETE /api/admin/departments/{id}/members/bulk
 *
 * Body:
 * {
 *   userIds: number[]
 * }
 *
 * @param {number} departmentId
 * @param {number[]} userIds
 */
export async function bulkRemoveDepartmentMembers(departmentId, userIds) {
  const response = await api.delete(
    `/admin/departments/${departmentId}/members/bulk`,
    {
      data: {
        userIds,
      },
    },
  );

  return response.data;
}

/* =========================================================
   STATISTICS
========================================================= */

/**
 * Get department statistics.
 *
 * @param {number} departmentId
 */
export async function getDepartmentStatistics(departmentId) {
  const response = await api.get(
    `/admin/departments/${departmentId}/statistics`,
  );

  return response.data;
}

/* =========================================================
   ACTIVITY
========================================================= */

/**
 * Get department activity.
 *
 * @param {number} departmentId
 * @param {number} days
 */
export async function getDepartmentActivity(departmentId, days = 30) {
  const response = await api.get(
    `/admin/departments/${departmentId}/activity`,
    {
      params: {
        days,
      },
    },
  );

  return response.data;
}

/* =========================================================
   COMPATIBILITY
   Dùng cho các component cũ đang gọi getAdminDepartments
========================================================= */

export async function getAdminDepartments(options = {}) {
  return getDepartments(options);
}
