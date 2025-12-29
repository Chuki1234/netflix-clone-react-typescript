import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_API_URL } from "src/constant";

const getToken = () => {
  return sessionStorage.getItem("token");
};

export interface Notification {
  _id: string;
  userId: string;
  type: "payment_approved" | "movie_updated" | "user_registered";
  title: string;
  message: string;
  read: boolean;
  metadata?: {
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    movieId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationApi = createApi({
  reducerPath: "notificationApi",
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
  tagTypes: ["Notification"],
  endpoints: (build) => ({
    getNotifications: build.query<
      GetNotificationsResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 } = {}) =>
        `/notifications?page=${page}&limit=${limit}`,
      providesTags: ["Notification"],
    }),
    getUnreadCount: build.query<UnreadCountResponse, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notification"],
    }),
    markAsRead: build.mutation<{ success: boolean; notification: Notification }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllAsRead: build.mutation<
      { success: boolean; modifiedCount: number },
      void
    >({
      query: () => ({
        url: "/notifications/read-all",
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: build.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useLazyGetNotificationsQuery,
  useLazyGetUnreadCountQuery,
} = notificationApi;

