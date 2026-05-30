'use client';

import { useMutation } from '@tanstack/react-query';
import type { RecommendResponse, RecommendRequest } from '@/lib/validations/recommend';

async function fetchRecommendation(data: RecommendRequest): Promise<RecommendResponse> {
  const res = await fetch('/api/recommend-doctor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? 'Failed to get recommendation');
  }

  return res.json() as Promise<RecommendResponse>;
}

export function useRecommendDoctor() {
  return useMutation<RecommendResponse, Error, RecommendRequest>({
    mutationFn: fetchRecommendation,
  });
}
