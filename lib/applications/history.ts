const SECOND = 1000;

/**
 * The time to store for a timeline entry moved to `requested`, held at
 * least a second after the entry before it and before the entry after it,
 * so moving an entry never reorders the timeline.
 */
export function clampBetweenNeighbours(
  entries: readonly { id: string; createdAt: Date }[],
  id: string,
  requested: Date,
): Date {
  const sorted = [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const index = sorted.findIndex((entry) => entry.id === id);
  if (index === -1) return requested;
  const older = sorted[index - 1]?.createdAt.getTime();
  const newer = sorted[index + 1]?.createdAt.getTime();
  let time = requested.getTime();
  if (newer !== undefined) time = Math.min(time, newer - SECOND);
  if (older !== undefined) time = Math.max(time, older + SECOND);
  return new Date(time);
}

/**
 * When a new status was reached: the date the user gave, or now. It can't
 * be in the future, and stays after `after` (the previous timeline entry
 * or the day applied) so the new status is still the latest entry.
 */
export function statusChangeTime(
  requested: Date | null,
  bounds: { after?: Date | null; now?: Date } = {},
): Date {
  const now = bounds.now ?? new Date();
  if (!requested) return now;
  let time = Math.min(requested.getTime(), now.getTime());
  if (bounds.after) time = Math.max(time, bounds.after.getTime() + SECOND);
  return new Date(Math.min(time, now.getTime()));
}
