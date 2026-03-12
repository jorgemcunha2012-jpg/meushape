import { getProxiedMediaUrl } from "@/services/muscleWikiService";

/**
 * Proxy MuscleWiki stream URLs through our edge function for auth.
 * Returns the original URL if it's not a MuscleWiki stream URL.
 */
export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("https://api.musclewiki.com/stream/")) {
    return getProxiedMediaUrl(url);
  }
  return url;
}
