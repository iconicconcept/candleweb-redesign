import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { User } from "../../types/user";

const userStore = (set: any) => ({
  user: {} as User,
  setUser: async (user: User) => {
    set((state: any) => ({
      user,
    }));
  },
  removeUser: async () => {
    set((state: any) => ({
      user: {},
    }));
  },
});

/* Devtools exposes the whole store, token included, to any browser extension
   that hooks the Redux DevTools API — development only. */
const useUserStore = create(
  devtools(
    persist(userStore, {
      name: "userStore",
    }),
    { enabled: process.env.NODE_ENV !== "production" }
  )
);

export default useUserStore;
