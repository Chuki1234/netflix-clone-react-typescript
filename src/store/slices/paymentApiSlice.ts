import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_API_URL } from "src/constant";

const getToken = () => {
  return localStorage.getItem("token");
};

export interface ProcessPaymentRequest {
  planId: "Mobile" | "Basic" | "Standard" | "Premium";
  paymentMethod?: string;
  paymentInfo?: any;
}

export interface ProcessPaymentResponse {
  success: boolean;
  message: string;
  subscription: {
    plan: string;
    status: string;
    paymentStatus: string;
    paymentDate: string;
    expiresAt: string;
  };
}

export interface ChangePlanRequest {
  newPlanId: "Mobile" | "Basic" | "Standard" | "Premium";
  paymentMethod?: string;
  paymentInfo?: any;
}

export interface ChangePlanResponse {
  success: boolean;
  message: string;
  subscription: {
    oldPlan: string;
    newPlan: string;
    status: string;
    paymentStatus: string;
    paymentDate: string;
    expiresAt: string;
  };
}

export interface PaymentStatusResponse {
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  paymentStatus: string | null;
  paymentDate: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
}

export const paymentApi = createApi({
  reducerPath: "paymentApi",
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
  tagTypes: ["Payment"],
  endpoints: (build) => ({
    processPayment: build.mutation<ProcessPaymentResponse, ProcessPaymentRequest>({
      query: (data) => ({
        url: "/payment/process",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payment", "User"],
    }),
    changePlan: build.mutation<ChangePlanResponse, ChangePlanRequest>({
      query: (data) => ({
        url: "/payment/change-plan",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payment", "User"],
    }),
    getPaymentStatus: build.query<PaymentStatusResponse, void>({
      query: () => "/payment/status",
      providesTags: ["Payment"],
    }),
  }),
});

export const {
  useProcessPaymentMutation,
  useChangePlanMutation,
  useGetPaymentStatusQuery,
} = paymentApi;

