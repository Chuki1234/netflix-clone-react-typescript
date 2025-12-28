import { createBrowserRouter } from "react-router-dom";
import { MAIN_PATH } from "src/constant";

import MainLayout from "src/layouts/MainLayout";
import AdminLayout from "src/layouts/AdminLayout";

const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("src/pages/LandingPage"),
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: MAIN_PATH.browse,
        lazy: () => import("src/pages/HomePage"),
      },
      {
        path: MAIN_PATH.genreExplore,
        children: [
          {
            path: ":genreId",
            lazy: () => import("src/pages/GenreExplore"),
          },
        ],
      },
      {
        path: MAIN_PATH.watch,
        children: [
          {
            path: ":mediaType/:id",
            lazy: () => import("src/pages/WatchPage"),
          },
        ],
      },
      {
        path: MAIN_PATH.myList,
        lazy: () => import("src/pages/MyListPage"),
      },
      {
        path: MAIN_PATH.account,
        lazy: () => import("src/pages/AccountPage"),
      },
      {
        path: MAIN_PATH.payment,
        lazy: () => import("src/pages/PaymentPage"),
      },
      {
        path: MAIN_PATH.paymentCheckout,
        lazy: () => import("src/pages/PaymentCheckoutPage"),
      },
    ],
  },
  {
    path: MAIN_PATH.login,
    lazy: () => import("src/pages/LoginPage"),
  },
  {
    path: MAIN_PATH.register,
    lazy: () => import("src/pages/RegisterPage"),
  },
  {
    path: MAIN_PATH.adminDashboard,
    element: <AdminLayout />,
    children: [
      {
        index: true,
        lazy: () => import("src/pages/admin/AdminDashboardHomePage"),
      },
      {
        path: "accounts",
        lazy: () => import("src/pages/admin/AdminAccountsPage"),
      },
      {
        path: "movies",
        lazy: () => import("src/pages/admin/AdminMoviesPage"),
      },
      {
        path: "categories",
        lazy: () => import("src/pages/admin/AdminCategoriesPage"),
      },
    ],
  },
]);

export default router;
