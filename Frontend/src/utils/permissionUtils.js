/* =========================================================
   PERMISSION UTILS
========================================================= */

/**
 * Get permissions from localStorage.
 */
export function getPermissions() {
  try {
    const saved = localStorage.getItem("permissions");

    if (!saved) {
      return [];
    }

    const permissions = JSON.parse(saved);

    if (!Array.isArray(permissions)) {
      return [];
    }

    return permissions;
  } catch {
    return [];
  }
}

/**
 * Check whether current user
 * has a specific permission.
 *
 * Example:
 *
 * hasPermission("Employee.View")
 * hasPermission("Employee.Create")
 */
export function hasPermission(permission) {
  if (!permission) {
    return false;
  }

  const permissions = getPermissions();

  return permissions.includes(permission);
}

/**
 * Check whether current user
 * has at least one permission.
 *
 * Example:
 *
 * hasAnyPermission([
 *   "Employee.Create",
 *   "Employee.Update"
 * ])
 */
export function hasAnyPermission(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  const userPermissions = getPermissions();

  return permissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Check whether current user
 * has all permissions.
 *
 * Example:
 *
 * hasAllPermissions([
 *   "Employee.View",
 *   "Employee.Update"
 * ])
 */
export function hasAllPermissions(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  const userPermissions = getPermissions();

  return permissions.every((permission) =>
    userPermissions.includes(permission),
  );
}

/**
 * Clear permissions when logout.
 */
export function clearPermissions() {
  localStorage.removeItem("permissions");
}
