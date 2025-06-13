export const calculateRemaining = (
  start: string | null,
  end: string | null
): { ratio: number; formatted: string } => {
  if (!start || !end) return { ratio: 1, formatted: "?" };

  const now = Date.now();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  const remainingTime = Math.max(endTime - now, 0);
  const totalDuration = endTime - startTime;
  const ratio = totalDuration > 0 ? remainingTime / totalDuration : 0;

  const minutes = Math.floor(remainingTime / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const formatted = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;

  return { ratio, formatted };
};
