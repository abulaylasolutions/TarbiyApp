import { eq, or, and, inArray, sql, desc } from "drizzle-orm";
import { db } from "./db";
import { users, children, notes, comments, pendingChanges, customTasks, taskCompletions, prayerLogs, fastingLogs, activityLogs, quranLogs, quranDailyLogs, childCustomPhotos, aqidahProgress, akhlaqNotes } from "@shared/schema";
import type { User, Child, Note, Comment, PendingChange, CustomTask, TaskCompletion, PrayerLog, FastingLog, ActivityLog, QuranLog, QuranDailyLog, ChildCustomPhoto, AqidahProgress, AkhlaqNote } from "@shared/schema";

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
  return Array.from(uniqueMap.values()).sort((a, b) => {
    const orderA = a.displayOrder != null ? parseInt(a.displayOrder, 10) : 999999;
    const orderB = b.displayOrder != null ? parseInt(b.displayOrder, 10) : 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
  });
}

export async function addChild(
  userId: string,
  name: string,
  birthDate: string,
  gender?: string,
  photoUri?: string,
  coParentName?: string,
  cardColor?: string,
  selectedCogenitori?: string[],
  avatarAsset?: string
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
      avatarAsset,
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
    avatarAsset?: string;
    cogenitori?: string;
    salahEnabled?: boolean;
    fastingEnabled?: boolean;
    arabicLearnedLetters?: string;
    hasHarakat?: boolean;
    canReadArabic?: boolean;
    canWriteArabic?: boolean;
    displayOrder?: string;
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

export async function getNotesForUser(userId: string, archived = false): Promise<Note[]> {
  const user = await getUserById(userId);
  if (!user) return [];
  const pairedIds = getPairedArray(user);
  const allUserIds = [userId, ...pairedIds];

  const userChildren = await getChildrenForUser(userId);
  const userChildIds = new Set(userChildren.map(c => c.id));

  const allNotes: Note[] = [];
  for (const uid of allUserIds) {
    const result = await db.select().from(notes).where(eq(notes.userId, uid));
    allNotes.push(...result);
  }
  const uniqueMap = new Map<string, Note>();
  for (const n of allNotes) {
    const isArchived = !!n.archived;
    if (isArchived !== archived) continue;

    if (n.tags && n.userId !== userId) {
      try {
        const tagIds: string[] = JSON.parse(n.tags);
        if (tagIds.length > 0) {
          const hasSharedChild = tagIds.some(tid => userChildIds.has(tid));
          if (!hasSharedChild) continue;
        }
      } catch {}
    }

    uniqueMap.set(n.id, n);
  }
  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );
}

export async function archiveNote(id: string, archived: boolean): Promise<Note> {
  const result = await db
    .update(notes)
    .set({ archived })
    .where(eq(notes.id, id))
    .returning();
  return result[0];
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

export async function updateTask(id: string, data: { name?: string; frequency?: string; time?: string | null; endTime?: string | null; days?: string | null }): Promise<CustomTask> {
  const result = await db.update(customTasks).set(data).where(eq(customTasks.id, id)).returning();
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

export async function getCustomPhotosForUser(userId: string): Promise<ChildCustomPhoto[]> {
  return db.select().from(childCustomPhotos).where(eq(childCustomPhotos.userId, userId));
}

export async function upsertCustomPhoto(userId: string, childId: string, photoUrl: string): Promise<ChildCustomPhoto> {
  const existing = await db.select().from(childCustomPhotos).where(
    and(eq(childCustomPhotos.userId, userId), eq(childCustomPhotos.childId, childId))
  );
  if (existing.length > 0) {
    const result = await db.update(childCustomPhotos).set({ photoUrl }).where(eq(childCustomPhotos.id, existing[0].id)).returning();
    console.log(`Foto personalizzata aggiornata per ${childId}: ${photoUrl}`);
    return result[0];
  }
  const result = await db.insert(childCustomPhotos).values({ userId, childId, photoUrl }).returning();
  console.log(`Foto personalizzata salvata per ${childId}: ${photoUrl}`);
  return result[0];
}

export async function getCustomPhoto(userId: string, childId: string): Promise<ChildCustomPhoto | null> {
  const result = await db.select().from(childCustomPhotos).where(
    and(eq(childCustomPhotos.userId, userId), eq(childCustomPhotos.childId, childId))
  );
  return result[0] || null;
}

export async function getAqidahProgress(childId: string): Promise<AqidahProgress[]> {
  return db.select().from(aqidahProgress).where(eq(aqidahProgress.childId, childId));
}

export async function upsertAqidahProgress(childId: string, itemKey: string, checked: boolean, note?: string): Promise<AqidahProgress> {
  const existing = await db.select().from(aqidahProgress).where(
    and(eq(aqidahProgress.childId, childId), eq(aqidahProgress.itemKey, itemKey))
  );
  if (existing.length > 0) {
    const updateData: any = { checked, updatedAt: new Date() };
    if (note !== undefined) updateData.note = note;
    const result = await db.update(aqidahProgress).set(updateData).where(eq(aqidahProgress.id, existing[0].id)).returning();
    return result[0];
  }
  const result = await db.insert(aqidahProgress).values({ childId, itemKey, checked, note: note || null, updatedAt: new Date() }).returning();
  return result[0];
}

export async function getEducationFeed(childId: string): Promise<Array<{ type: string; key: string; label: string; timestamp: string }>> {
  const aqidahItems = await db.select().from(aqidahProgress)
    .where(and(eq(aqidahProgress.childId, childId), eq(aqidahProgress.checked, true)))
    .orderBy(desc(aqidahProgress.updatedAt))
    .limit(5);

  const quranItems = await db.select().from(quranLogs)
    .where(and(eq(quranLogs.childId, childId), eq(quranLogs.status, 'learned')))
    .orderBy(desc(quranLogs.createdAt))
    .limit(5);

  const activityItems = await db.select().from(activityLogs)
    .where(and(eq(activityLogs.childId, childId), inArray(activityLogs.category, ['akhlaq', 'arabo'])))
    .orderBy(desc(activityLogs.createdAt))
    .limit(5);

  const combined: Array<{ type: string; key: string; label: string; timestamp: string }> = [];

  for (const item of aqidahItems) {
    combined.push({
      type: 'aqidah',
      key: item.itemKey,
      label: item.itemKey,
      timestamp: (item.updatedAt ?? item.createdAt ?? new Date()).toISOString(),
    });
  }

  for (const item of quranItems) {
    combined.push({
      type: 'quran',
      key: item.surahNumber,
      label: item.surahNumber,
      timestamp: (item.createdAt ?? new Date()).toISOString(),
    });
  }

  for (const item of activityItems) {
    combined.push({
      type: item.category as string,
      key: item.text,
      label: item.text,
      timestamp: (item.createdAt ?? new Date()).toISOString(),
    });
  }

  combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return combined.slice(0, 5);
}

export async function getAkhlaqNotes(childId: string): Promise<AkhlaqNote[]> {
  return db.select().from(akhlaqNotes).where(eq(akhlaqNotes.childId, childId));
}

export async function upsertAkhlaqNote(childId: string, itemKey: string, note: string): Promise<AkhlaqNote> {
  const existing = await db.select().from(akhlaqNotes).where(
    and(eq(akhlaqNotes.childId, childId), eq(akhlaqNotes.itemKey, itemKey))
  );
  if (existing.length > 0) {
    const result = await db.update(akhlaqNotes).set({ note, updatedAt: new Date() }).where(eq(akhlaqNotes.id, existing[0].id)).returning();
    return result[0];
  }
  const result = await db.insert(akhlaqNotes).values({ childId, itemKey, note, updatedAt: new Date() }).returning();
  return result[0];
}

export async function deleteAkhlaqNote(childId: string, itemKey: string): Promise<void> {
  await db.delete(akhlaqNotes).where(
    and(eq(akhlaqNotes.childId, childId), eq(akhlaqNotes.itemKey, itemKey))
  );
}
