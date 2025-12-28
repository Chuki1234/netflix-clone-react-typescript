import { createBrowserRouter } from "react-router-dom";
import { MAIN_PATH } from "src/constant";

import MainLayout from "src/layouts/MainLayout";

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
]);

export default router;
