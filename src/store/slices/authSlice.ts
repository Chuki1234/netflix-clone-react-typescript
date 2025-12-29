import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "./authApiSlice";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Load token from sessionStorage (tab-specific, allows different accounts per tab)
const loadToken = (): string | null => {
  return sessionStorage.getItem("token");
};

// Load user from sessionStorage (tab-specific, allows different accounts per tab)
const loadUser = (): User | null => {
  const userStr = sessionStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
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
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      sessionStorage.setItem("token", action.payload.token);
      sessionStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
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

