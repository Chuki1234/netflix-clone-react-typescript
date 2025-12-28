import React from "react";
import { useStorageSync } from "../hooks/useStorageSync";

/**
 * Provider component that enables cross-tab synchronization for auth state
 * This component should be placed high in the component tree
 */
export default function StorageSyncProvider({ children }: { children: React.ReactNode }) {
  useStorageSync();
  return <>{children}</>;
}

