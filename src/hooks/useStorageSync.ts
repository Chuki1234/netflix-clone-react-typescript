import { useEffect } from "react";
import { useAppDispatch } from "./redux";
import { syncAuthState } from "../store/slices/authSlice";

/**
 * Hook to sync Redux auth state
 * NOTE: With sessionStorage, storage events don't fire across tabs (sessionStorage is tab-specific)
 * This hook is kept for compatibility but won't sync across tabs anymore
 * Each tab maintains its own independent auth state, allowing different accounts per tab
 */
export function useStorageSync() {
  // sessionStorage is tab-specific, so no cross-tab sync is needed
  // Each tab will maintain its own auth state independently
  // This allows different accounts to be logged in in different tabs
  return;
}

