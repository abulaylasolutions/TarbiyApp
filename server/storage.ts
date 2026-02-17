import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, children, notes } from "@shared/schema";
import type { User, Child, Note } from "@shared/schema";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generateUniqueInviteCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateInviteCode();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.personalInviteCode, code));
    if (existing.length === 0) return code;
    attempts++;
  }
  return generateInviteCode() + Math.floor(Math.random() * 10);
}

export async function createUser(email: string, hashedPassword: string): Promise<User> {
  const inviteCode = await generateUniqueInviteCode();
  const result = await db
    .insert(users)
    .values({ email, password: hashedPassword, personalInviteCode: inviteCode })
    .returning();
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

export async function getUserByInviteCode(code: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.personalInviteCode, code));
  return result[0];
}

export async function updateUserProfile(
  id: string,
  data: { name: string; birthDate: string; gender: string; photoUrl?: string }
): Promise<User> {
  const result = await db
    .update(users)
    .set({ ...data, isProfileComplete: true })
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

export async function updateUserPremium(id: string, isPremium: boolean): Promise<User> {
  const result = await db
    .update(users)
    .set({ isPremium })
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

export async function pairCogenitori(uid1: string, uid2: string): Promise<void> {
  await db.update(users).set({ pairedCogenitore: uid2 }).where(eq(users.id, uid1));
  await db.update(users).set({ pairedCogenitore: uid1 }).where(eq(users.id, uid2));
}

export async function unpairCogenitore(uid: string): Promise<void> {
  const user = await getUserById(uid);
  if (!user || !user.pairedCogenitore) return;
  const partnerId = user.pairedCogenitore;
  await db.update(users).set({ pairedCogenitore: null }).where(eq(users.id, uid));
  await db.update(users).set({ pairedCogenitore: null }).where(eq(users.id, partnerId));
}

export async function getChildrenForUser(userId: string): Promise<Child[]> {
  const user = await getUserById(userId);
  if (!user) return [];
  const userIds = [userId];
  if (user.pairedCogenitore) userIds.push(user.pairedCogenitore);

  const allChildren: Child[] = [];
  for (const uid of userIds) {
    const result = await db.select().from(children).where(eq(children.userId, uid));
    allChildren.push(...result);
  }
  const uniqueMap = new Map<string, Child>();
  for (const c of allChildren) uniqueMap.set(c.id, c);
  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );
}

export async function addChild(
  userId: string,
  name: string,
  birthDate: string,
  gender?: string,
  photoUri?: string,
  coParentName?: string,
  cardColor?: string
): Promise<Child> {
  const result = await db
    .insert(children)
    .values({ userId, name, birthDate, gender, photoUri, coParentName, cardColor })
    .returning();
  return result[0];
}

export async function updateChild(
  id: string,
  data: { name?: string; birthDate?: string; gender?: string; photoUri?: string; coParentName?: string; cardColor?: string }
): Promise<Child> {
  const result = await db
    .update(children)
    .set(data)
    .where(eq(children.id, id))
    .returning();
  return result[0];
}

export async function removeChild(id: string): Promise<void> {
  await db.delete(children).where(eq(children.id, id));
}

export async function getNotesForUser(userId: string): Promise<Note[]> {
  const user = await getUserById(userId);
  if (!user) return [];
  const userIds = [userId];
  if (user.pairedCogenitore) userIds.push(user.pairedCogenitore);

  const allNotes: Note[] = [];
  for (const uid of userIds) {
    const result = await db.select().from(notes).where(eq(notes.userId, uid));
    allNotes.push(...result);
  }
  const uniqueMap = new Map<string, Note>();
  for (const n of allNotes) uniqueMap.set(n.id, n);
  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );
}

export async function addNote(
  userId: string,
  text: string,
  color: string,
  rotation: string,
  author: string,
  tags?: string
): Promise<Note> {
  const result = await db
    .insert(notes)
    .values({ userId, text, color, rotation, author, tags })
    .returning();
  return result[0];
}

export async function updateNote(
  id: string,
  data: { text?: string; color?: string; tags?: string }
): Promise<Note> {
  const result = await db
    .update(notes)
    .set(data)
    .where(eq(notes.id, id))
    .returning();
  return result[0];
}

export async function removeNote(id: string): Promise<void> {
  await db.delete(notes).where(eq(notes.id, id));
}
