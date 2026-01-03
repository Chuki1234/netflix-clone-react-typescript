import React from "react";

/**
 * Safe context creator that allows providing a fallback value.
 * If a fallback is provided and the Provider is missing, the hook
 * returns the fallback instead of throwing, preventing hard crashes.
 */
export default function createSafeContext<TValue>(fallback?: TValue) {
  const context = React.createContext<TValue | undefined>(undefined);

  function useContext() {
    const value = React.useContext(context);
    if (value === undefined) {
      if (fallback !== undefined) {
        console.warn("Context used without Provider, using fallback value.");
        return fallback;
      }
      throw new Error("useContext must be inside a Provider with a value");
    }
    return value;
  }

  return [useContext, context.Provider] as const;
}
