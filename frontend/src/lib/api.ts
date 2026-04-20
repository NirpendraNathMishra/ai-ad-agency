import type { BusinessInput } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
export const WS_BASE =
  process.env.NEXT_PUBLIC_WS_BASE ?? "ws://localhost:8000";

export async function createRun(body: BusinessInput): Promise<{ run_id: string }> {
  const res = await fetch(`${API_BASE}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createRun failed: ${res.status} ${text}`);
  }
  return res.json();
}

export function openRunSocket(runId: string): WebSocket {
  return new WebSocket(`${WS_BASE}/ws/runs/${runId}`);
}

export type RunListItem = {
  run_id: string;
  status: string;
  business_name: string;
  created_at: string;
  event_count: number;
  error: string | null;
};

export async function listRuns(status?: string): Promise<RunListItem[]> {
  const url = status
    ? `${API_BASE}/api/runs?status=${encodeURIComponent(status)}`
    : `${API_BASE}/api/runs`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`listRuns failed: ${res.status}`);
  const data = await res.json();
  return data.runs as RunListItem[];
}
