import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_API_URL } from "src/constant";

export interface User {
  _id: string;
  name: string;
  email: string;
  subscriptionPlan?: "Mobile" | "Basic" | "Standard" | "Premium" | null;
  subscriptionStatus?: "pending" | "active" | "inactive" | "cancelled" | null;
  paymentStatus?: "pending" | "confirmed" | "failed" | null;
  paymentDate?: Date | string | null;
  activatedAt?: Date | string | null;
  expiresAt?: Date | string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
  subscriptionPlan?: "Mobile" | "Basic" | "Standard" | "Premium" | null;
  subscriptionStatus?: "pending" | "active" | "inactive" | "cancelled" | null;
  paymentStatus?: "pending" | "confirmed" | "failed" | null;
}

export interface CheckEmailResponse {
  exists: boolean;
}

const getToken = () => {
  return localStorage.getItem("token");
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["User"],
  endpoints: (build) => ({
    checkEmail: build.query<CheckEmailResponse, string>({
      query: (email) => `/auth/check-email?email=${encodeURIComponent(email)}`,
    }),
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials,
      }),
    }),
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    getMe: build.query<User, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
  }),
});

export const {
  useCheckEmailQuery,
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
} = authApi;

