export function formatDuration(seconds: string | number): string {
  let remaining = typeof seconds === "string" ? parseInt(seconds) : seconds;

  const units = [
    { label: "year", seconds: 365 * 24 * 60 * 60 },
    { label: "month", seconds: 30 * 24 * 60 * 60 }, // approximation
    { label: "day", seconds: 24 * 60 * 60 },
    { label: "hour", seconds: 60 * 60 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  const result: string[] = [];

  for (const unit of units) {
    const count = Math.floor(remaining / unit.seconds);
    if (count > 0) {
      result.push(`${count} ${unit.label}${count > 1 ? "s" : ""}`);
      remaining %= unit.seconds;
    }
  }

  return result.join(", ") || "0 seconds";
}
