import { eq, or, and, inArray, sql, desc } from "drizzle-orm";
import { db } from "./db";
import { users, children, notes, comments, pendingChanges, customTasks, taskCompletions, prayerLogs, fastingLogs, activityLogs, quranLogs, quranDailyLogs } from "@shared/schema";
import type { User, Child, Note, Comment, PendingChange, CustomTask, TaskCompletion, PrayerLog, FastingLog, ActivityLog, QuranLog, QuranDailyLog } from "@shared/schema";

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

function getPairedArray(user: User): string[] {
  if (user.pairedCogenitori) {
    try { return JSON.parse(user.pairedCogenitori); } catch {}
  }
  if (user.pairedCogenitore) return [user.pairedCogenitore];
  return [];
}

function getCogenitoriArray(child: Child): string[] {
  if (child.cogenitori) {
    try { return JSON.parse(child.cogenitori); } catch {}
  }
  return [child.userId];
}

export async function createUser(email: string, hashedPassword: string): Promise<User> {
  const inviteCode = await generateUniqueInviteCode();
  const result = await db
    .insert(users)
    .values({ email, password: hashedPassword, personalInviteCode: inviteCode, pairedCogenitori: "[]" })
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

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const result = await db.select().from(users).where(inArray(users.id, ids));
  return result;
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

export async function updateUserLanguage(id: string, language: string): Promise<User> {
  const result = await db
    .update(users)
    .set({ preferredLanguage: language })
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

export async function addCogenitore(uid: string, targetUid: string): Promise<void> {
  const user = await getUserById(uid);
  const target = await getUserById(targetUid);
  if (!user || !target) return;

  const userPaired = getPairedArray(user);
  const targetPaired = getPairedArray(target);

  if (!userPaired.includes(targetUid)) userPaired.push(targetUid);
  if (!targetPaired.includes(uid)) targetPaired.push(uid);

  await db.update(users).set({
    pairedCogenitori: JSON.stringify(userPaired),
    pairedCogenitore: userPaired[0] || null,
  }).where(eq(users.id, uid));

  await db.update(users).set({
    pairedCogenitori: JSON.stringify(targetPaired),
    pairedCogenitore: targetPaired[0] || null,
  }).where(eq(users.id, targetUid));
}

export async function removeCogenitore(uid: string, targetUid: string): Promise<void> {
  const user = await getUserById(uid);
  const target = await getUserById(targetUid);
  if (!user || !target) return;

  const userPaired = getPairedArray(user).filter(id => id !== targetUid);
  const targetPaired = getPairedArray(target).filter(id => id !== uid);

  await db.update(users).set({
    pairedCogenitori: JSON.stringify(userPaired),
    pairedCogenitore: userPaired[0] || null,
  }).where(eq(users.id, uid));

  await db.update(users).set({
    pairedCogenitori: JSON.stringify(targetPaired),
    pairedCogenitore: targetPaired[0] || null,
  }).where(eq(users.id, targetUid));
}

export async function getPairedCogenitori(uid: string): Promise<User[]> {
  const user = await getUserById(uid);
  if (!user) return [];
  const pairedIds = getPairedArray(user);
  if (pairedIds.length === 0) return [];
  return getUsersByIds(pairedIds);
}

export async function getChildrenForUser(userId: string): Promise<Child[]> {
  const allChildren = await db.select().from(children);
  const filtered = allChildren.filter(child => {
    const cogs = getCogenitoriArray(child);
    return cogs.includes(userId) || child.userId === userId;
  });
  const uniqueMap = new Map<string, Child>();
  for (const c of filtered) uniqueMap.set(c.id, c);
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
  cardColor?: string,
  selectedCogenitori?: string[]
): Promise<Child> {
  const cogenitoriArray = [userId];
  if (selectedCogenitori) {
    for (const cid of selectedCogenitori) {
      if (!cogenitoriArray.includes(cid)) cogenitoriArray.push(cid);
    }
  }
  const result = await db
    .insert(children)
    .values({
      userId,
      name,
      birthDate,
      gender,
      photoUri,
      coParentName,
      cardColor,
      cogenitori: JSON.stringify(cogenitoriArray),
    })
    .returning();
  return result[0];
}

export async function updateChild(
  id: string,
  data: {
    name?: string;
    birthDate?: string;
    gender?: string;
    photoUri?: string;
    coParentName?: string;
    cardColor?: string;
    cogenitori?: string;
    salahEnabled?: boolean;
    fastingEnabled?: boolean;
    arabicLearnedLetters?: string;
    hasHarakat?: boolean;
    canReadArabic?: boolean;
    canWriteArabic?: boolean;
  }
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
  const pairedIds = getPairedArray(user);
  const allUserIds = [userId, ...pairedIds];

  const allNotes: Note[] = [];
  for (const uid of allUserIds) {
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

export async function createPendingChange(
  userId: string,
  targetUserId: string,
  childId: string | null,
  action: string,
  details: string
): Promise<PendingChange> {
  const result = await db
    .insert(pendingChanges)
    .values({ userId, targetUserId, childId, action, status: "pending", details })
    .returning();
  return result[0];
}

export async function getPendingChangesForUser(userId: string): Promise<PendingChange[]> {
  const result = await db
    .select()
    .from(pendingChanges)
    .where(eq(pendingChanges.targetUserId, userId));
  return result.filter(p => p.status === "pending").sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );
}

export async function approvePendingChange(id: string): Promise<PendingChange> {
  const pending = await db.select().from(pendingChanges).where(eq(pendingChanges.id, id));
  if (!pending[0]) throw new Error("Pending change not found");
  const change = pending[0];

  if (change.action === "add_child" && change.childId) {
    const child = await db.select().from(children).where(eq(children.id, change.childId));
    if (child[0]) {
      const cogs = getCogenitoriArray(child[0]);
      if (!cogs.includes(change.targetUserId)) {
        cogs.push(change.targetUserId);
        await db.update(children).set({ cogenitori: JSON.stringify(cogs) }).where(eq(children.id, change.childId));
      }
    }
  }

  const result = await db
    .update(pendingChanges)
    .set({ status: "approved" })
    .where(eq(pendingChanges.id, id))
    .returning();
  return result[0];
}

export async function rejectPendingChange(id: string): Promise<PendingChange> {
  const result = await db
    .update(pendingChanges)
    .set({ status: "rejected" })
    .where(eq(pendingChanges.id, id))
    .returning();
  return result[0];
}

export async function getCommentsForNote(noteId: string): Promise<Comment[]> {
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.noteId, noteId));
  return result.sort(
    (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );
}

export async function addComment(
  noteId: string,
  userId: string,
  authorName: string,
  text: string
): Promise<Comment> {
  const result = await db
    .insert(comments)
    .values({ noteId, userId, authorName, text })
    .returning();
  return result[0];
}

export async function removeComment(id: string): Promise<void> {
  await db.delete(comments).where(eq(comments.id, id));
}

export async function getTasksForChild(childId: string): Promise<CustomTask[]> {
  return db.select().from(customTasks).where(eq(customTasks.childId, childId));
}

export async function addTask(childId: string, userId: string, name: string, frequency: string, time?: string, endTime?: string, days?: string): Promise<CustomTask> {
  const result = await db.insert(customTasks).values({ childId, userId, name, frequency, time, endTime, days }).returning();
  return result[0];
}

export async function removeTask(id: string): Promise<void> {
  await db.delete(taskCompletions).where(eq(taskCompletions.taskId, id));
  await db.delete(customTasks).where(eq(customTasks.id, id));
}

export async function getTaskCompletions(childId: string, date: string): Promise<TaskCompletion[]> {
  return db.select().from(taskCompletions).where(and(eq(taskCompletions.childId, childId), eq(taskCompletions.date, date)));
}

export async function upsertTaskCompletion(taskId: string, childId: string, date: string, completed: boolean, note?: string): Promise<TaskCompletion> {
  const existing = await db.select().from(taskCompletions).where(and(eq(taskCompletions.taskId, taskId), eq(taskCompletions.date, date)));
  if (existing.length > 0) {
    const result = await db.update(taskCompletions).set({ completed, note }).where(eq(taskCompletions.id, existing[0].id)).returning();
    return result[0];
  }
  const result = await db.insert(taskCompletions).values({ taskId, childId, date, completed, note }).returning();
  return result[0];
}

export async function getPrayerLog(childId: string, date: string): Promise<PrayerLog | null> {
  const result = await db.select().from(prayerLogs).where(and(eq(prayerLogs.childId, childId), eq(prayerLogs.date, date)));
  return result[0] || null;
}

export async function upsertPrayerLog(childId: string, date: string, data: Partial<PrayerLog>): Promise<PrayerLog> {
  const existing = await db.select().from(prayerLogs).where(and(eq(prayerLogs.childId, childId), eq(prayerLogs.date, date)));
  if (existing.length > 0) {
    const result = await db.update(prayerLogs).set(data).where(eq(prayerLogs.id, existing[0].id)).returning();
    return result[0];
  }
  const result = await db.insert(prayerLogs).values({ childId, date, ...data } as any).returning();
  return result[0];
}

export async function getFastingLog(childId: string, date: string): Promise<FastingLog | null> {
  const result = await db.select().from(fastingLogs).where(and(eq(fastingLogs.childId, childId), eq(fastingLogs.date, date)));
  return result[0] || null;
}

export async function upsertFastingLog(childId: string, date: string, status: string, note?: string): Promise<FastingLog> {
  const existing = await db.select().from(fastingLogs).where(and(eq(fastingLogs.childId, childId), eq(fastingLogs.date, date)));
  if (existing.length > 0) {
    const result = await db.update(fastingLogs).set({ status, note }).where(eq(fastingLogs.id, existing[0].id)).returning();
    return result[0];
  }
  const result = await db.insert(fastingLogs).values({ childId, date, status, note }).returning();
  return result[0];
}

export async function getActivityLogs(childId: string, limit = 20): Promise<ActivityLog[]> {
  return db.select().from(activityLogs).where(eq(activityLogs.childId, childId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

export async function addActivityLog(childId: string, userId: string, authorName: string, text: string, category: string, date: string): Promise<ActivityLog> {
  const result = await db.insert(activityLogs).values({ childId, userId, authorName, text, category, date }).returning();
  return result[0];
}

export async function getQuranLogs(childId: string): Promise<QuranLog[]> {
  return db.select().from(quranLogs).where(eq(quranLogs.childId, childId));
}

export async function upsertQuranLog(childId: string, surahNumber: string, status: string): Promise<QuranLog> {
  const existing = await db.select().from(quranLogs).where(and(eq(quranLogs.childId, childId), eq(quranLogs.surahNumber, surahNumber)));
  if (existing.length > 0) {
    const result = await db.update(quranLogs).set({ status }).where(eq(quranLogs.id, existing[0].id)).returning();
    return result[0];
  }
  const result = await db.insert(quranLogs).values({ childId, surahNumber, status }).returning();
  return result[0];
}

export async function getQuranDailyLog(childId: string, date: string): Promise<QuranDailyLog | null> {
  const result = await db.select().from(quranDailyLogs).where(and(eq(quranDailyLogs.childId, childId), eq(quranDailyLogs.date, date)));
  return result[0] || null;
}

export async function upsertQuranDailyLog(childId: string, date: string, completed: boolean, note?: string): Promise<QuranDailyLog> {
  const existing = await db.select().from(quranDailyLogs).where(and(eq(quranDailyLogs.childId, childId), eq(quranDailyLogs.date, date)));
  if (existing.length > 0) {
    const result = await db.update(quranDailyLogs).set({ completed, note }).where(eq(quranDailyLogs.id, existing[0].id)).returning();
    return result[0];
  }
  const result = await db.insert(quranDailyLogs).values({ childId, date, completed, note }).returning();
  return result[0];
}
