export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000; // nanoseconds to milliseconds
  const date = new Date(ms);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
