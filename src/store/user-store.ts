import { create } from "zustand";

type UserRole = "STREAMER" | "ADMIN";

export type DbUser = {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

type UserStore = {
  dbUser: DbUser | null;
  setDbUser: (user: DbUser) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  dbUser: null,
  setDbUser: (user) => set({ dbUser: user }),
}));
