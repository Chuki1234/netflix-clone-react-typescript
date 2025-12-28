import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "./authApiSlice";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Load token from localStorage
const loadToken = (): string | null => {
  return localStorage.getItem("token");
};

// Load user from localStorage
const loadUser = (): User | null => {
  const userStr = localStorage.getItem("user");
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
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    syncAuthState: (state) => {
      // Sync state from localStorage (called when storage event is triggered)
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

