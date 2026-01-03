import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "./authApiSlice";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Load token with priority: sessionStorage -> localStorage (for "remember me")
const loadToken = (): string | null => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

// Load user with priority: sessionStorage -> localStorage (for "remember me")
const loadUser = (): User | null => {
  const sessionUser = sessionStorage.getItem("user");
  const localUser = localStorage.getItem("user");
  const candidate = sessionUser ?? localUser;
  if (candidate) {
    try {
      return JSON.parse(candidate);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const initialState: AuthState = {
  user: loadUser(),
  token: loadToken(),
  isAuthenticated: !!loadToken(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; rememberMe?: boolean }>
    ) => {
      const { user, token, rememberMe = false } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      // choose storage based on rememberMe
      const primaryStorage = rememberMe ? localStorage : sessionStorage;
      const secondaryStorage = rememberMe ? sessionStorage : localStorage;

      primaryStorage.setItem("token", token);
      primaryStorage.setItem("user", JSON.stringify(user));

      // clear stale data from the other storage
      secondaryStorage.removeItem("token");
      secondaryStorage.removeItem("user");
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      sessionStorage.setItem("user", JSON.stringify(action.payload));
    },
    syncAuthState: (state) => {
      // Note: sessionStorage is tab-specific, so storage events won't fire across tabs
      // This function is kept for compatibility but won't be used with sessionStorage
      // Each tab maintains its own independent auth state
      const token = loadToken();
      const user = loadUser();
      state.token = token;
      state.user = user;
      state.isAuthenticated = !!token;
    },
  },
});

export const { setCredentials, logout, updateUser, syncAuthState } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;

