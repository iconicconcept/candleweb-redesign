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

const useUserStore = create(
  devtools(
    persist(userStore, {
      name: "userStore",
    })
  )
);

export default useUserStore;
