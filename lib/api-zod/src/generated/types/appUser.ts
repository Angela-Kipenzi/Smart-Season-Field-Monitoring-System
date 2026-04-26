
import type { Role } from "./role";

export interface AppUser {
  id: number;
  clerkId: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
}
