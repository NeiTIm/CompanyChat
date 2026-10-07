import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAvailablePermissions,
  getRole,
  updateRolePermissions,
} from "../../../services/admin/roleService";


export default function RolePermissionModal({
  open,
  role,
  onClose,
  onSaved,
  canAssign,
}) {

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [permissions, setPermissions] =
    useState([]);

  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState(new Set());

  const [roleInfo, setRoleInfo] =
    useState(role || null);


  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {

    if (
      !open ||
      !role?.id
    ) {
      return;
    }

    let cancelled = false;

    async function loadPermissions() {

      setLoading(true);
      setError("");

      try {

        const [
          roleData,
          availableData,
        ] = await Promise.all([
          getRole(role.id),
          getAvailablePermissions(role.id),
        ]);

        if (cancelled) {
          return;
        }

        setRoleInfo(
          roleData
        );

        const available =
          Array.isArray(
            availableData
          )
            ? availableData
            : [];

        setPermissions(
          available
        );

        const assignedIds =
          available
            .filter(
              permission =>
                permission.assigned
            )
            .map(
              permission =>
                Number(
                  permission.id
                )
            );

        setSelectedPermissionIds(
          new Set(
            assignedIds
          )
        );

      } catch (err) {

        console.error(
          "Không thể tải Permission:",
          err
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
            "Không thể tải danh sách Permission."
          );
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    }

    loadPermissions();

    return () => {
      cancelled = true;
    };

  }, [
    open,
    role?.id,
  ]);


  /* =======================================================
     RESET WHEN CLOSED
  ======================================================= */

  useEffect(() => {

    if (open) {
      return;
    }

    setPermissions([]);
    setSelectedPermissionIds(
      new Set()
    );
    setError("");
    setLoading(false);
    setSaving(false);
    setRoleInfo(
      role || null
    );

  }, [
    open,
    role,
  ]);


  /* =======================================================
     GROUP BY MODULE
  ======================================================= */

  const groupedPermissions =
    useMemo(() => {

      const groups = {};

      permissions.forEach(
        permission => {

          const moduleName =
            permission.module?.trim() ||
            "Other";

          if (!groups[moduleName]) {
            groups[moduleName] = [];
          }

          groups[moduleName].push(
            permission
          );
        }
      );

      return Object.entries(
        groups
      ).sort(
        ([moduleA], [moduleB]) =>
          moduleA.localeCompare(
            moduleB
          )
      );

    }, [
      permissions,
    ]);


  /* =======================================================
     TOTALS
  ======================================================= */

  const totalPermissions =
    permissions.length;

  const selectedCount =
    selectedPermissionIds.size;


  /* =======================================================
     TOGGLE SINGLE PERMISSION
  ======================================================= */

  function handleTogglePermission(
    permissionId
  ) {

    if (!canAssign || saving) {
      return;
    }

    const id =
      Number(
        permissionId
      );

    setSelectedPermissionIds(
      previous => {

        const next =
          new Set(
            previous
          );

        if (
          next.has(id)
        ) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      }
    );
  }


  /* =======================================================
     MODULE HELPERS
  ======================================================= */

  function getModulePermissionIds(
    modulePermissions
  ) {
    return modulePermissions.map(
      permission =>
        Number(
          permission.id
        )
    );
  }


  function isModuleFullySelected(
    modulePermissions
  ) {

    if (
      !modulePermissions.length
    ) {
      return false;
    }

    return modulePermissions.every(
      permission =>
        selectedPermissionIds.has(
          Number(
            permission.id
          )
        )
    );
  }


  function isModulePartiallySelected(
    modulePermissions
  ) {

    const ids =
      getModulePermissionIds(
        modulePermissions
      );

    const selected =
      ids.filter(
        id =>
          selectedPermissionIds.has(
            id
          )
      ).length;

    return (
      selected > 0 &&
      selected < ids.length
    );
  }


  /* =======================================================
     TOGGLE MODULE
  ======================================================= */

  function handleToggleModule(
    modulePermissions
  ) {

    if (!canAssign || saving) {
      return;
    }

    const ids =
      getModulePermissionIds(
        modulePermissions
      );

    const fullySelected =
      isModuleFullySelected(
        modulePermissions
      );

    setSelectedPermissionIds(
      previous => {

        const next =
          new Set(
            previous
          );

        if (fullySelected) {

          ids.forEach(
            id =>
              next.delete(id)
          );

        } else {

          ids.forEach(
            id =>
              next.add(id)
          );

        }

        return next;
      }
    );
  }


  /* =======================================================
     SELECT ALL
  ======================================================= */

  const allSelected =
    totalPermissions > 0 &&
    selectedCount ===
      totalPermissions;


  function handleToggleAll() {

    if (!canAssign || saving) {
      return;
    }

    if (allSelected) {

      setSelectedPermissionIds(
        new Set()
      );

      return;
    }

    setSelectedPermissionIds(
      new Set(
        permissions.map(
          permission =>
            Number(
              permission.id
            )
        )
      )
    );
  }


  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave() {

    if (
      !canAssign ||
      saving ||
      !roleInfo?.id
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {

      const permissionIds =
        Array.from(
          selectedPermissionIds
        ).sort(
          (a, b) =>
            a - b
        );

      await updateRolePermissions(
        roleInfo.id,
        permissionIds
      );

      if (onSaved) {
        await onSaved(
          permissionIds
        );
      }

    } catch (err) {

      console.error(
        "Không thể cập nhật Permission:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Không thể cập nhật Permission."
      );

    } finally {

      setSaving(false);

    }
  }


  /* =======================================================
     ESC TO CLOSE
  ======================================================= */

  useEffect(() => {

    if (!open) {
      return;
    }

    function handleKeyDown(
      event
    ) {

      if (
        event.key === "Escape" &&
        !saving
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, [
    open,
    saving,
    onClose,
  ]);


  /* =======================================================
     NO RENDER
  ======================================================= */

  if (
    !open ||
    !roleInfo
  ) {
    return null;
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {

        if (
          event.target ===
            event.currentTarget &&
          !saving
        ) {
          onClose();
        }

      }}
    >

      <div
        className="admin-role-modal admin-role-permission-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-permission-title"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-role-modal-header">

          <div>

            <h2 id="role-permission-title">
              Quản lý Permission
            </h2>

            <p className="admin-role-permission-subtitle">

              Role:

              <strong>
                {" "}
                {roleInfo.name}
              </strong>

            </p>

          </div>


          <button
            type="button"
            className="admin-role-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng"
          >
            ×
          </button>

        </div>


        {/* =================================================
            BODY
        ================================================= */}

        <div className="admin-role-modal-body">

          {/* ===============================================
              SUMMARY BAR
          =============================================== */}

          <div className="admin-role-permission-summary">

            <div className="admin-role-permission-summary-info">

              <span>
                Permission đã chọn
              </span>

              <strong>
                {selectedCount}
                {" / "}
                {totalPermissions}
              </strong>

            </div>


            <button
              type="button"
              className="admin-role-permission-select-all"
              onClick={
                handleToggleAll
              }
              disabled={
                !canAssign ||
                saving ||
                loading ||
                totalPermissions === 0
              }
            >
              {allSelected
                ? "Bỏ chọn tất cả"
                : "Chọn tất cả"}
            </button>

          </div>


          {/* ===============================================
              ERROR
          =============================================== */}

          {error && (
            <div
              className="admin-role-permission-error"
              role="alert"
            >
              {error}
            </div>
          )}


          {/* ===============================================
              LOADING
          =============================================== */}

          {loading ? (

            <div className="admin-role-detail-loading">

              <div className="admin-role-loading-spinner" />

              <span>
                Đang tải Permission...
              </span>

            </div>

          ) : permissions.length === 0 ? (

            <div className="admin-role-permission-empty">

              <div className="admin-role-permission-empty-icon">
                !
              </div>

              <strong>
                Chưa có Permission
              </strong>

              <span>
                Hệ thống chưa có Permission
                nào để cấp cho Role này.
              </span>

            </div>

          ) : (

            /* =============================================
               MODULE GROUPS
            ============================================= */

            <div className="admin-role-permission-groups">

              {groupedPermissions.map(
                ([
                  moduleName,
                  modulePermissions,
                ]) => {

                  const fullySelected =
                    isModuleFullySelected(
                      modulePermissions
                    );

                  const partiallySelected =
                    isModulePartiallySelected(
                      modulePermissions
                    );

                  const selectedInModule =
                    modulePermissions.filter(
                      permission =>
                        selectedPermissionIds.has(
                          Number(
                            permission.id
                          )
                        )
                    ).length;

                  return (
                    <section
                      key={moduleName}
                      className="admin-role-permission-module"
                    >

                      {/* =================================
                          MODULE HEADER
                      ================================= */}

                      <div className="admin-role-permission-module-header">

                        <div>

                          <h3>
                            {moduleName}
                          </h3>

                          <span>
                            {selectedInModule}
                            {" / "}
                            {modulePermissions.length}
                            {" Permission"}
                          </span>

                        </div>


                        <button
                          type="button"
                          className={`admin-role-permission-module-toggle ${
                            fullySelected
                              ? "selected"
                              : ""
                          } ${
                            partiallySelected
                              ? "partial"
                              : ""
                          }`}
                          onClick={() =>
                            handleToggleModule(
                              modulePermissions
                            )
                          }
                          disabled={
                            !canAssign ||
                            saving
                          }
                        >
                          <span
                            className="admin-role-checkbox"
                          >
                            {fullySelected ? (
                              <span>
                                ✓
                              </span>
                            ) : partiallySelected ? (
                              <span>
                                −
                              </span>
                            ) : null}
                          </span>

                          <span>
                            {fullySelected
                              ? "Bỏ chọn module"
                              : "Chọn module"}
                          </span>

                        </button>

                      </div>


                      {/* =================================
                          PERMISSION LIST
                      ================================= */}

                      <div className="admin-role-permission-list">

                        {modulePermissions.map(
                          permission => {

                            const id =
                              Number(
                                permission.id
                              );

                            const checked =
                              selectedPermissionIds.has(
                                id
                              );

                            return (
                              <label
                                key={id}
                                className={`admin-role-permission-item ${
                                  checked
                                    ? "selected"
                                    : ""
                                } ${
                                  !canAssign
                                    ? "disabled"
                                    : ""
                                }`}
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    handleTogglePermission(
                                      id
                                    )
                                  }
                                  disabled={
                                    !canAssign ||
                                    saving
                                  }
                                />


                                <span className="admin-role-permission-checkbox">

                                  {checked && (
                                    <span>
                                      ✓
                                    </span>
                                  )}

                                </span>


                                <span className="admin-role-permission-content">

                                  <strong>
                                    {
                                      permission.name
                                    }
                                  </strong>

                                  <code>
                                    {
                                      permission.code
                                    }
                                  </code>

                                  {permission.description && (
                                    <small>
                                      {
                                        permission.description
                                      }
                                    </small>
                                  )}

                                </span>

                              </label>
                            );
                          }
                        )}

                      </div>

                    </section>
                  );
                }
              )}

            </div>

          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="admin-role-modal-footer">

          <button
            type="button"
            className="admin-role-modal-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>


          {canAssign && (
            <button
              type="button"
              className="admin-role-modal-submit"
              onClick={
                handleSave
              }
              disabled={
                loading ||
                saving ||
                permissions.length === 0
              }
            >

              {saving ? (
                <>
                  <span className="admin-role-button-spinner" />

                  <span>
                    Đang lưu...
                  </span>
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                    <path d="M17 21v-8H7v8" />
                    <path d="M7 3v5h8" />
                  </svg>

                  <span>
                    Lưu Permission
                  </span>
                </>
              )}

            </button>
          )}

        </div>

      </div>

    </div>
  );
}