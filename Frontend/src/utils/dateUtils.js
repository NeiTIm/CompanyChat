export function formatTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLastSeen(date) {
  if (!date) return "Offline";

  const utcDate =
    typeof date === "string" &&
    !date.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(date)
      ? `${date}Z`
      : date;

  const d = new Date(utcDate);

  return `Hoạt động ${d.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
  })} ${d.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
