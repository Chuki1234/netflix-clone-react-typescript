import { configureStore } from "@reduxjs/toolkit";
import { tmdbApi } from "./slices/apiSlice";
import { authApi } from "./slices/authApiSlice";
import { paymentApi } from "./slices/paymentApiSlice";
import { adminApi } from "./slices/adminApiSlice";
import { notificationApi } from "./slices/notificationApiSlice";
import discoverReducer from "./slices/discover";
import userPreferencesReducer from "./slices/userPreferences";
import authReducer from "./slices/authSlice";

const store = configureStore({
  reducer: {
    discover: discoverReducer,
    userPreferences: userPreferencesReducer,
    auth: authReducer,
    [tmdbApi.reducerPath]: tmdbApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      tmdbApi.middleware,
      authApi.middleware,
      paymentApi.middleware,
      adminApi.middleware,
      notificationApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
