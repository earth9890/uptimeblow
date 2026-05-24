"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useApi<T>(endpoint: string, options?: { skip?: boolean }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") || undefined;
      const res = await api<{ success: boolean; data: T }>(endpoint, { token });
      setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!options?.skip) {
      fetchData();
    }
  }, [fetchData, options?.skip]);

  return { data, loading, error, refetch: fetchData };
}
