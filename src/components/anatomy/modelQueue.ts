export interface ModelQueue {
  wanted: string[];
  admitted: string[];
  statuses: Record<string, "loaded" | "failed">;
}
export type QueueAction =
  | { type: "select"; ids: string[] }
  | { type: "loaded" | "failed"; id: string }
  | { type: "retry"; ids: string[] };
export const MODEL_CONCURRENCY = 8;
function fill(
  wanted: string[],
  admitted: string[],
  statuses: ModelQueue["statuses"],
) {
  const pending = admitted.filter((id) => !statuses[id]).length;
  const additions = wanted
    .filter((id) => !admitted.includes(id))
    .slice(0, Math.max(0, MODEL_CONCURRENCY - pending));
  return [...admitted, ...additions];
}
export const initialQueue = (ids: string[]): ModelQueue => ({
  wanted: ids,
  admitted: ids.slice(0, MODEL_CONCURRENCY),
  statuses: {},
});
export function modelQueueReducer(
  previous: ModelQueue,
  action: QueueAction,
): ModelQueue {
  let wanted = previous.wanted,
    admitted = previous.admitted,
    statuses = previous.statuses;
  if (action.type === "select") {
    wanted = action.ids;
    admitted = admitted.filter((id) => wanted.includes(id));
    statuses = Object.fromEntries(
      Object.entries(statuses).filter(([id]) => admitted.includes(id)),
    );
  } else if (action.type === "retry") {
    admitted = admitted.filter((id) => !action.ids.includes(id));
    statuses = Object.fromEntries(
      Object.entries(statuses).filter(([id]) => !action.ids.includes(id)),
    );
  } else {
    if (
      !wanted.includes(action.id) ||
      !admitted.includes(action.id) ||
      statuses[action.id] === action.type
    )
      return previous;
    statuses = { ...statuses, [action.id]: action.type };
  }
  return { wanted, admitted: fill(wanted, admitted, statuses), statuses };
}
