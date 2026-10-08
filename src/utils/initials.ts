/** Hai chữ cái đầu của tên (lấy hai từ cuối), dùng cho ảnh đại diện chữ */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
