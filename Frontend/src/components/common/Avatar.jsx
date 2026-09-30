function Avatar({
  user,
  size = "medium",
  showStatus = false,
}) {
  const name =
    user?.fullName ||
    user?.username ||
    "?";

  const initial =
    name.charAt(0).toUpperCase();

  return (
    <div
      className={`avatar-wrapper avatar-${size}`}
    >
      <div className="avatar">
        {initial}
      </div>

      {showStatus && (
        <span
          className={`avatar-status ${
            user?.isOnline
              ? "online"
              : "offline"
          }`}
        />
      )}
    </div>
  );
}

export default Avatar;