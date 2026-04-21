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

export const API_BASE_V2 =
  process.env.NEXT_PUBLIC_API_BASE_V2 ?? "http://localhost:8001";

export type RunListItemV2 = {
  run_id: string;
  status: string;
  business_name: string;
  industry?: string;
  created_at: string;
  event_count: number;
  has_report?: boolean;
  error: string | null;
};

export async function listRunsV2(status?: string): Promise<RunListItemV2[]> {
  const url = status
    ? `${API_BASE_V2}/api/v2/runs?status=${encodeURIComponent(status)}`
    : `${API_BASE_V2}/api/v2/runs`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`listRunsV2 failed: ${res.status}`);
  const data = await res.json();
  return data.runs as RunListItemV2[];
}
