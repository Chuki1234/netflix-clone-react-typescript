import { useEffect } from "react";
import { useAppDispatch } from "./redux";
import { syncAuthState } from "../store/slices/authSlice";

/**
 * Hook to sync Redux auth state across browser tabs using localStorage events
 * When localStorage changes in one tab, other tabs will sync their Redux state
 */
export function useStorageSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle changes to 'token' or 'user' keys
      if (e.key === "token" || e.key === "user") {
        // Sync auth state from localStorage
        dispatch(syncAuthState());
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener("storage", handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);
}

