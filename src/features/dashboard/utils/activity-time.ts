export function resolveActivityTime(relativeTime: string): { date: string; timeOfDay: string } {
  const now = new Date();
  const parts = relativeTime.split(" ");
  const timeOfDay = parts[0];

  const rest = parts.slice(1).join(" ");
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(rest)) return { date: rest, timeOfDay };

  let daysAgo = 0;

  if (rest === "hôm nay") {
    daysAgo = 0;
  } else if (rest === "hôm qua") {
    daysAgo = 1;
  } else if (rest.includes("tuần trước")) {
    const weeks = parseInt(rest, 10) || 1;
    daysAgo = weeks * 7;
  } else if (rest.includes("ngày trước")) {
    daysAgo = parseInt(rest, 10) || 0;
  }

  const target = new Date(now);
  target.setDate(target.getDate() - daysAgo);

  const day = String(target.getDate()).padStart(2, "0");
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const year = target.getFullYear();

  return { date: `${day}/${month}/${year}`, timeOfDay };
}
