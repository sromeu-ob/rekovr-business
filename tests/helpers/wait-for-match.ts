import { ApiClient } from './api-client';

/**
 * Poll the B2B matches endpoint until at least one match appears
 * for the given found item. Returns the first match found.
 */
export async function waitForMatch(
  apiClient: ApiClient,
  foundItemId: string,
  timeoutMs: number = 60_000,
  intervalMs: number = 3_000,
): Promise<{ match_id: string; status: string; score: number }> {
  const start = Date.now();
  let lastError: string = '';

  while (Date.now() - start < timeoutMs) {
    try {
      const data = await apiClient.getBusinessMatchesList(foundItemId);
      const matches = data?.matches || data || [];
      if (Array.isArray(matches) && matches.length > 0) {
        console.log(
          `  ✓ Match found after ${Math.round((Date.now() - start) / 1000)}s: ${matches[0].match_id} (score: ${matches[0].score})`,
        );
        return matches[0];
      }
    } catch (err: any) {
      lastError = err.message;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `No match found for item ${foundItemId} within ${timeoutMs}ms. Last error: ${lastError}`,
  );
}
