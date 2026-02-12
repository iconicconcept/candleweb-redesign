// use-hydration.ts
import { useEffect, useState } from "react";
import { StoreApi, UseBoundStore } from "zustand";
import useUserStore from "./useUserStore";

export const useHydration = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const checkHydrationStatus = async () => {
      // Assuming your store has a method to check if hydration is complete
      const isHydrated = await useUserStore.persist.hasHydrated(); // Adjust this line based on your actual store implementation
      setHydrated(isHydrated);
    };

    checkHydrationStatus();

    // Subscribe to store updates if needed
    const unsubscribe = useUserStore.subscribe(checkHydrationStatus); // Adjust selectors as per your store

    return () => unsubscribe();
  }, []);
  return hydrated;
};
