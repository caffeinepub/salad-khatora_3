/**
 * useAppActor — provides an actor initialized with admin access.
 *
 * Since the app uses email/password auth (frontend-only) and not Internet
 * Identity, we create a deterministic Ed25519 identity from a fixed seed so
 * the backend's AccessControl system can recognize a non-anonymous caller.
 * The first call to _initializeAccessControlWithSecret with the correct
 * caffeineAdminToken registers this identity as admin.
 *
 * The admin token is persisted in localStorage so it survives across sessions.
 */
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { useQuery } from "@tanstack/react-query";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";

const ADMIN_TOKEN_STORAGE_KEY = "sk_admin_token";

// A fixed seed so the same principal is used across page reloads.
// This is intentional — the app has a single shared admin identity.
const SEED = new Uint8Array(32).fill(0x53); // deterministic, non-random

let _identity: Ed25519KeyIdentity | null = null;
function getAppIdentity(): Ed25519KeyIdentity {
  if (!_identity) {
    _identity = Ed25519KeyIdentity.generate(SEED);
  }
  return _identity;
}

/**
 * Get admin token — from URL first (Caffeine injects it), then localStorage fallback.
 * Always persist to localStorage when found in URL so future visits without token still work.
 */
function getAdminToken(): string {
  // Try URL/session first (Caffeine injects caffeineAdminToken into URL at deploy time)
  const urlToken = getSecretParameter("caffeineAdminToken");
  if (urlToken) {
    // Persist to localStorage for future sessions
    try {
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, urlToken);
    } catch {
      // localStorage may be unavailable
    }
    return urlToken;
  }

  // Fall back to localStorage
  try {
    const stored = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage may be unavailable
  }

  return "";
}

export function useAppActor() {
  const actorQuery = useQuery({
    queryKey: ["app-actor-initialized"],
    queryFn: async () => {
      const identity = getAppIdentity();
      const actor = await createActorWithConfig({
        agentOptions: { identity },
      });

      const adminToken = getAdminToken();
      try {
        await actor._initializeAccessControlWithSecret(adminToken);
      } catch {
        // May fail if already initialized — safe to ignore
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: 3,
  });

  return {
    actor: actorQuery.data ?? null,
    isFetching: actorQuery.isFetching,
  };
}
