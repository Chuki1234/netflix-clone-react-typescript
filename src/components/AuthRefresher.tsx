import { useEffect } from "react";
import { useGetMeQuery } from "src/store/slices/authApiSlice";
import { selectToken, updateUser, logout } from "src/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "src/hooks/redux";
import { loadForUser } from "src/store/slices/userPreferences";

/**
 * Global auth refresher: if a token exists, fetch the latest user profile.
 * Ensures subscription status and roles stay updated after admin actions.
 */
export default function AuthRefresher() {
  const token = useAppSelector(selectToken);
  const dispatch = useAppDispatch();

  const { data, isSuccess, isError, error, refetch } = useGetMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    // On success, sync user info (e.g., subscriptionStatus after admin approval)
    if (isSuccess && data) {
      dispatch(updateUser(data));
      dispatch(loadForUser(data._id));
    }
  }, [isSuccess, data, dispatch]);

  useEffect(() => {
    // If token invalid/expired, logout
    if (isError && (error as any)?.status === 401) {
      dispatch(logout());
      dispatch(loadForUser(null));
    }
  }, [isError, error, dispatch]);

  // Optional: allow manual refetch trigger from outside if needed
  useEffect(() => {
    if (token) {
      refetch();
    } else {
      // No token: load guest/empty preferences
      dispatch(loadForUser(null));
    }
  }, [token, refetch, dispatch]);

  return null;
}

