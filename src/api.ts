import type { ProgressItem } from './types';

const API_URL = '/.netlify/functions/progress';

export async function fetchProgress(): Promise<ProgressItem[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to load progress records');
  }

  const payload = (await response.json()) as { data: ProgressItem[] };
  return payload.data;
}

export async function createProgress(record: ProgressItem): Promise<ProgressItem> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error('Failed to save progress record');
  }

  const payload = (await response.json()) as { data: ProgressItem };
  return payload.data;
}
