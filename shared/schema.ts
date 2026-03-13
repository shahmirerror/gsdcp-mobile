import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Dog = {
  id: string;
  dog_name: string;
  KP: string | null;
  breed: string;
  sex: string;
  dob: string | null;
  color: string | null;
  imageUrl: string | null;
  owner: string | null;
  breeder: string | null;
  sire: string | null;
  dam: string | null;
  titles: string[];
  microchip: string | null;
};

export type Breeder = {
  id: string;
  name: string;
  kennelName: string;
  location: string;
  phone: string;
  email: string;
  imageUrl: string;
  activeSince: string;
  totalDogs: number;
  description: string;
};

export type ShowEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  judge: string;
  status: "upcoming" | "ongoing" | "completed";
  entryCount: number;
  description: string;
};

export type ShowResult = {
  id: string;
  showEventId: string;
  showName: string;
  dogId: string;
  dogName: string;
  handler: string;
  award: string;
  placement: number;
  className: string;
  date: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipId: string;
  membershipStatus: "active" | "expired" | "pending";
  memberSince: string;
  imageUrl: string;
  city: string;
  dogIds: string[];
};
