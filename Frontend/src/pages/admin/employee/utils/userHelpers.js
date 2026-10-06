export function getInitial(user) {
  return (
    user?.fullName?.trim()?.charAt(0) ||
    user?.username?.trim()?.charAt(0) ||
    "U"
  ).toUpperCase();
}

export function formatLastSeen(value) {
  if (!value) {
    return "Chưa hoạt động";
  }

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}