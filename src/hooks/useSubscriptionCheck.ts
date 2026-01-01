import { useAppSelector } from "./redux";
import { selectCurrentUser } from "src/store/slices/authSlice";

/**
 * Hook to check if user has active subscription
 * Returns true only if subscriptionStatus === "active"
 */
export const useSubscriptionCheck = () => {
  const user = useAppSelector(selectCurrentUser);
  
  const isActive = user?.subscriptionStatus === "active";
  const isPending = user?.subscriptionStatus === "pending";
  const hasNoSubscription = !user?.subscriptionStatus || user?.subscriptionStatus === null;
  
  return {
    isActive,
    isPending,
    hasNoSubscription,
    subscriptionStatus: user?.subscriptionStatus || null,
    subscriptionPlan: user?.subscriptionPlan || null,
  };
};

