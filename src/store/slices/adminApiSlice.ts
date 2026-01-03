import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_API_URL } from "src/constant";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  subscriptionPlan: "Mobile" | "Basic" | "Standard" | "Premium" | null;
  subscriptionStatus: "pending" | "active" | "inactive" | "cancelled" | null;
  paymentStatus: "pending" | "confirmed" | "failed" | null;
  paymentDate: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  _id: string;
  name: string;
  email: string;
  role: "admin";
  token: string;
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  pendingPayments: number;
  totalRevenue: number;
  planDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

export interface UpdateSubscriptionRequest {
  action: "approve" | "reject" | "cancel" | "update";
  subscriptionStatus?: "pending" | "active" | "inactive" | "cancelled";
  paymentStatus?: "pending" | "confirmed" | "failed";
}

export interface UpdateSubscriptionResponse {
  success: boolean;
  message: string;
  user: AdminUser;
}

const getToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

export interface AdminMoviePayload {
  tmdbId?: number;
  title: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  mediaType?: "movie" | "tv";
  releaseDate?: string;
  genres?: { id: number; name: string }[];
  voteAverage?: number;
  voteCount?: number;
  runtime?: number;
}

export interface AdminMovie extends AdminMoviePayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_API_URL,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["AdminUser", "AdminStats", "PendingPayments", "AdminMovies"],
  endpoints: (builder) => ({
    adminLogin: builder.mutation<AdminLoginResponse, AdminLoginRequest>({
      query: (credentials) => ({
        url: "/admin/login",
        method: "POST",
        body: credentials,
      }),
    }),
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "/admin/stats",
      providesTags: ["AdminStats"],
    }),
    getAllUsers: builder.query<
      UsersResponse,
      { page?: number; limit?: number; search?: string; subscriptionStatus?: string; paymentStatus?: string }
    >({
      query: (params) => ({
        url: "/admin/users",
        params,
      }),
      providesTags: ["AdminUser"],
    }),
    getUserById: builder.query<AdminUser, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminUser", id }],
    }),
    updateUserSubscription: builder.mutation<
      UpdateSubscriptionResponse,
      { userId: string; data: UpdateSubscriptionRequest }
    >({
      query: ({ userId, data }) => ({
        url: `/admin/users/${userId}/subscription`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["AdminUser", "AdminStats", "PendingPayments"],
    }),
    getPendingPayments: builder.query<{ count: number; users: AdminUser[] }, void>({
      query: () => "/admin/payments/pending",
      providesTags: ["PendingPayments"],
    }),
    getAdminMovies: builder.query<
      { items: AdminMovie[]; pagination: { page: number; pages: number; total: number; limit: number } },
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 20, search } = {}) => ({
        url: "/admin/movies",
        params: { page, limit, search },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ _id }) => ({ type: "AdminMovies" as const, id: _id })),
              { type: "AdminMovies" as const, id: "PARTIAL-LIST" },
            ]
          : [{ type: "AdminMovies" as const, id: "PARTIAL-LIST" }],
    }),
    createAdminMovie: builder.mutation<AdminMovie, AdminMoviePayload>({
      query: (body) => ({
        url: "/admin/movies",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "AdminMovies", id: "PARTIAL-LIST" }],
    }),
    updateAdminMovie: builder.mutation<AdminMovie, { id: string; data: Partial<AdminMoviePayload> }>({
      query: ({ id, data }) => ({
        url: `/admin/movies/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, _error, arg) => [
        { type: "AdminMovies", id: arg.id },
        { type: "AdminMovies", id: "PARTIAL-LIST" },
      ],
    }),
    deleteAdminMovie: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/movies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "AdminMovies", id },
        { type: "AdminMovies", id: "PARTIAL-LIST" },
      ],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useGetDashboardStatsQuery,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserSubscriptionMutation,
  useGetPendingPaymentsQuery,
  useGetAdminMoviesQuery,
  useCreateAdminMovieMutation,
  useUpdateAdminMovieMutation,
  useDeleteAdminMovieMutation,
} = adminApi;

