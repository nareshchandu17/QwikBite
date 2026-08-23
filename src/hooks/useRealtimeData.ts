import { useState, useEffect } from "react";
import logger from "@/lib/logger";

// Using logger for toast notifications
const showToast = {
  success: (title: string, message: string) =>
    logger.info(`✅ ${title}: ${message}`),
  error: (title: string, message: string, details?: unknown) =>
    logger.error(`❌ ${title}: ${message}`, details || ""),
};

export function useRealtimeData<T>(
  endpoint: string,
  initialData: T,
  refreshInterval = 10000, // Default to 10 seconds
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!endpoint) {
      const error = new Error("Endpoint is not defined");
      setError(error);
      showToast.error("Configuration Error", "API endpoint is not defined");
      setIsLoading(false);
      return;
    }

    try {
      logger.info(`[useRealtimeData] Fetching data from: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText || "Failed to fetch data"}`,
        );
      }

      const result = await response.json();
      logger.info("[useRealtimeData] Data received:", result);
      setData(result);
      setError(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("An unknown error occurred");
      logger.error("[useRealtimeData] Error fetching data:", {
        endpoint,
        error: error.message,
        stack: error.stack,
      });
      setError(error);
      showToast.error("Fetch Error", "Failed to fetch data", {
        endpoint,
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling
    const intervalId = setInterval(fetchData, refreshInterval);

    // Cleanup
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, refreshInterval]);

  const updateData = async (updates: Partial<T>, updateEndpoint?: string) => {
    try {
      const response = await fetch(updateEndpoint || endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Update failed");

      // Refetch to ensure we have the latest data
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Update failed"));
      showToast.error("Error", "Failed to update data");
      return false;
    }
  };

  return { data, isLoading, error, updateData, refresh: fetchData };
}
