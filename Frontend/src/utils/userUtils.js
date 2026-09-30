export function getInitial(user) {
  const name =
    user?.fullName ||
    user?.username ||
    "?";

  return name.charAt(0).toUpperCase();
}