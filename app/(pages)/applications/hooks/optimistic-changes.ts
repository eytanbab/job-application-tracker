import { createContext, useContext } from "react";
import type { StatusKind } from "@/lib/utils";

/**
 * A change shown before the server confirms it. Changes live in useOptimistic
 * state, so React drops them when the action's transition ends: by then the
 * server's fresh rows have arrived, or the action failed and the old state
 * comes back on its own.
 */
export type OptimisticChange =
  | { kind: "move"; id: string; statusCategory: StatusKind; status: string }
  | { kind: "delete"; id: string };

type Row = { id?: string; status: string; statusCategory?: string | null };

/** Rows with pending deletes removed and pending moves applied. */
export function applyOptimisticChanges<T extends Row>(rows: T[], changes: readonly OptimisticChange[]): T[] {
  if (changes.length === 0) return rows;
  const deleted = new Set(changes.filter((c) => c.kind === "delete").map((c) => c.id));
  const moves = new Map(
    changes.flatMap((c) => (c.kind === "move" ? [[c.id, c] as const] : [])),
  );
  return rows
    .filter((row) => !row.id || !deleted.has(row.id))
    .map((row) => {
      const move = row.id ? moves.get(row.id) : undefined;
      return move ? { ...row, status: move.status, statusCategory: move.statusCategory } : row;
    });
}

/** Records a pending change; call it inside the transition that runs the action. */
export const OptimisticChangeContext = createContext<(change: OptimisticChange) => void>(() => {});

export const useAddOptimisticChange = () => useContext(OptimisticChangeContext);
