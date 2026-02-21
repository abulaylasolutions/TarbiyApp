import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { pool } from "./db";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByInviteCode,
  getUsersByIds,
  updateUserProfile,
  updateUserPremium,
  addCogenitore,
  removeCogenitore,
  getPairedCogenitori,
  getChildrenForUser,
  addChild,
  updateChild,
  removeChild,
  getNotesForUser,
  addNote,
  updateNote,
  removeNote,
  getCommentsForNote,
  addComment,
  removeComment,
  createPendingChange,
  getPendingChangesForUser,
  approvePendingChange,
  rejectPendingChange,
  updateUserLanguage,
  getTasksForChild,
  addTask,
  updateTask,
  removeTask,
  getTaskCompletions,
  upsertTaskCompletion,
  getPrayerLog,
  upsertPrayerLog,
  getFastingLog,
  upsertFastingLog,
  getActivityLogs,
  addActivityLog,
  getQuranLogs,
  upsertQuranLog,
  getQuranDailyLog,
  upsertQuranDailyLog,
  archiveNote,
  getCustomPhotosForUser,
  upsertCustomPhoto,
  getAqidahProgress,
  upsertAqidahProgress,
  getEducationFeed,
  getAkhlaqNotes,
  upsertAkhlaqNote,
  deleteAkhlaqNote,
} from "./storage";
import { registerSchema, loginSchema, profileSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non autenticato" });
  }
  next();
}

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo immagini consentite'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool: pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "tarbiyapp-secret-key-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  app.use("/uploads", (await import("express")).default.static(uploadsDir));

  app.post("/api/upload", requireAuth as any, upload.single('photo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nessun file caricato" });
      }
      const jpegFilename = req.file.filename.replace(/\.[^.]+$/, '.jpg');
      const jpegPath = path.join(uploadsDir, jpegFilename);
      await sharp(req.file.path)
        .resize(800, 800, { fit: 'cover', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(jpegPath);
      if (req.file.path !== jpegPath) {
        fs.unlinkSync(req.file.path);
      }
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const photoUrl = `${protocol}://${host}/uploads/${jpegFilename}`;
      console.log(`Foto caricata: ${photoUrl}`);
      return res.json({ url: photoUrl });
    } catch (error) {
      console.error("Errore upload foto:", error);
      return res.status(500).json({ message: "Errore upload" });
    }
  });

  app.get("/api/custom-photos", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const photos = await getCustomPhotosForUser(userId);
      const photoMap: Record<string, string> = {};
      for (const p of photos) {
        photoMap[p.childId] = p.photoUrl;
      }
      return res.json(photoMap);
    } catch (error) {
      return res.status(500).json({ message: "Errore caricamento foto personalizzate" });
    }
  });

  app.post("/api/custom-photos/:childId", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const childId = req.params.childId as string;
      const { photoUrl } = req.body;
      if (!photoUrl) {
        return res.status(400).json({ message: "photoUrl richiesto" });
      }
      const result = await upsertCustomPhoto(userId, childId, photoUrl);
      return res.json(result);
    } catch (error) {
      console.error("Errore salvataggio foto personalizzata:", error);
      return res.status(500).json({ message: "Errore salvataggio foto personalizzata" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Email e password richiesti (password min 6 caratteri)" });
      }
      const existing = await getUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(409).json({ message: "Un account con questa email esiste già" });
      }
      const hashed = await bcrypt.hash(parsed.data.password, 10);
      const user = await createUser(parsed.data.email, hashed);
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Email e password richiesti" });
      }
      const user = await getUserByEmail(parsed.data.email);
      if (!user) {
        return res.status(401).json({ message: "Email o password non validi" });
      }
      const valid = await bcrypt.compare(parsed.data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Email o password non validi" });
      }
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Errore nel logout" });
      res.clearCookie("connect.sid");
      return res.json({ message: "Logout effettuato" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    try {
      const user = await getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Utente non trovato" });
      }
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.put("/api/auth/profile", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const parsed = profileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dati profilo incompleti" });
      }
      const user = await updateUserProfile(req.session.userId!, parsed.data);
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.put("/api/auth/language", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { language } = req.body;
      if (!['it', 'en', 'ar'].includes(language)) {
        return res.status(400).json({ message: "Lingua non valida" });
      }
      const user = await updateUserLanguage(req.session.userId!, language);
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.put("/api/auth/premium", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { isPremium } = req.body;
      const user = await updateUserPremium(req.session.userId!, !!isPremium);
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/cogenitore", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const paired = await getPairedCogenitori(req.session.userId!);
      const safePaired = paired.map(p => {
        const { password: _, ...safe } = p;
        return safe;
      });
      return res.json({ cogenitori: safePaired });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/cogenitore/pair", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { inviteCode } = req.body;
      if (!inviteCode || typeof inviteCode !== "string" || inviteCode.length !== 6) {
        return res.status(400).json({ message: "Codice invito non valido (6 caratteri)" });
      }

      const targetUser = await getUserByInviteCode(inviteCode.toUpperCase());
      if (!targetUser) {
        return res.status(404).json({ message: "Codice invito non trovato" });
      }

      if (targetUser.id === req.session.userId) {
        return res.status(400).json({ message: "Non puoi collegarti con te stesso" });
      }

      const currentPaired = await getPairedCogenitori(req.session.userId!);
      if (currentPaired.some(p => p.id === targetUser.id)) {
        return res.status(400).json({ message: "Sei già collegato con questo cogenitore" });
      }

      await addCogenitore(req.session.userId!, targetUser.id);

      const { password: _, ...safeTarget } = targetUser;
      return res.json({ message: "Cogenitore collegato con successo!", cogenitore: safeTarget });
    } catch (error) {
      console.error("Pair error:", error);
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/cogenitore/unpair", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ message: "ID cogenitore richiesto" });
      }
      await removeCogenitore(req.session.userId!, targetUserId);
      return res.json({ message: "Collegamento rimosso" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/children", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getChildrenForUser(req.session.userId!);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { name, birthDate, gender, photoUri, coParentName, cardColor, selectedCogenitori, avatarAsset } = req.body;
      if (!name || !birthDate) {
        return res.status(400).json({ message: "Nome e data di nascita richiesti" });
      }

      const user = await getUserById(req.session.userId!);
      if (!user?.isPremium) {
        const existing = await getChildrenForUser(req.session.userId!);
        const ownChildren = existing.filter(c => c.userId === req.session.userId);
        if (ownChildren.length >= 1) {
          return res.status(403).json({ message: "Limite raggiunto. Passa a Premium per figli illimitati!" });
        }
      }

      const child = await addChild(
        req.session.userId!, name, birthDate, gender, photoUri, coParentName, cardColor, selectedCogenitori, avatarAsset
      );

      return res.status(201).json(child);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.put("/api/children/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { name, birthDate, gender, photoUri, coParentName, cardColor, cogenitori, avatarAsset } = req.body;
      const child = await updateChild(req.params.id as string, { name, birthDate, gender, photoUri, coParentName, cardColor, cogenitori, avatarAsset });
      return res.json(child);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.delete("/api/children/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      await removeChild(req.params.id as string);
      return res.json({ message: "Figlio rimosso" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/notes", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const archived = req.query.archived === 'true';
      const result = await getNotesForUser(req.session.userId!, archived);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/notes/:id/archive", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const archived = req.body?.archived;
      const shouldArchive = archived !== false;
      console.log(`Archiviando nota ${req.params.id}, archived=${shouldArchive}, body=`, req.body);
      const result = await archiveNote(req.params.id as string, shouldArchive);
      console.log(`Nota ${req.params.id} archiviata:`, result?.archived);
      return res.json(result);
    } catch (error) {
      console.error(`Errore archiviazione nota ${req.params.id}:`, error);
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/notes", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { text, color, rotation, author, tags } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Testo richiesto" });
      }
      const note = await addNote(req.session.userId!, text, color || "#FFD3B6", rotation || "0", author || "Genitore", tags);
      return res.status(201).json(note);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.put("/api/notes/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { text, color, tags } = req.body;
      const note = await updateNote(req.params.id as string, { text, color, tags });
      return res.json(note);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.delete("/api/notes/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      await removeNote(req.params.id as string);
      return res.json({ message: "Nota rimossa" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/notes/:noteId/comments", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getCommentsForNote(req.params.noteId as string);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/notes/:noteId/comments", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ message: "Testo richiesto" });
      }
      const user = await getUserById(req.session.userId!);
      const authorName = user?.name || "Genitore";
      const comment = await addComment(req.params.noteId as string, req.session.userId!, authorName, text.trim());
      return res.status(201).json(comment);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.delete("/api/comments/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      await removeComment(req.params.id as string);
      return res.json({ message: "Commento rimosso" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/pending", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getPendingChangesForUser(req.session.userId!);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/pending/:id/approve", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await approvePendingChange(req.params.id as string);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/pending/:id/reject", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await rejectPendingChange(req.params.id as string);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  // Dashboard: Custom Tasks
  app.get("/api/children/:childId/tasks", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getTasksForChild(req.params.childId as string);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/tasks", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { name, frequency, time, endTime, days } = req.body;
      if (!name) return res.status(400).json({ message: "Nome richiesto" });
      const task = await addTask(req.params.childId as string, req.session.userId!, name, frequency || "daily", time, endTime, days);
      return res.status(201).json(task);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.put("/api/tasks/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { name, frequency, time, endTime, days } = req.body;
      const task = await updateTask(req.params.id as string, { name, frequency, time, endTime, days });
      return res.json(task);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      await removeTask(req.params.id as string);
      return res.json({ message: "Task rimosso" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  // Dashboard: Task Completions
  app.get("/api/children/:childId/completions/:date", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getTaskCompletions(req.params.childId as string, req.params.date as string);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/completions", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { taskId, date, completed, note } = req.body;
      if (!taskId || !date) return res.status(400).json({ message: "taskId e date richiesti" });
      const result = await upsertTaskCompletion(taskId, req.params.childId as string, date, completed, note);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  // Dashboard: Prayer Logs
  app.get("/api/children/:childId/prayers/:date", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getPrayerLog(req.params.childId as string, req.params.date as string);
      return res.json(result || {});
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/prayers", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { date, ...prayerData } = req.body;
      if (!date) return res.status(400).json({ message: "date richiesto" });
      const result = await upsertPrayerLog(req.params.childId as string, date, prayerData);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  // Dashboard: Fasting Logs
  app.get("/api/children/:childId/fasting/:date", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getFastingLog(req.params.childId as string, req.params.date as string);
      return res.json(result || { status: "no", note: "" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/fasting", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { date, status, note } = req.body;
      if (!date) return res.status(400).json({ message: "date richiesto" });
      const result = await upsertFastingLog(req.params.childId as string, date, status || "no", note);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  // Dashboard: Activity Logs
  app.get("/api/children/:childId/activity", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getActivityLogs(req.params.childId as string);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/activity", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { text, category, date } = req.body;
      if (!text) return res.status(400).json({ message: "Testo richiesto" });
      const user = await getUserById(req.session.userId!);
      const authorName = user?.name || "Genitore";
      const d = date || new Date().toISOString().split("T")[0];
      const result = await addActivityLog(req.params.childId as string, req.session.userId!, authorName, text, category || "general", d);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/reorder", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { orderedIds } = req.body ?? {};
      if (!Array.isArray(orderedIds)) return res.status(400).json({ message: "orderedIds richiesto" });
      console.log(`Riordinamento figli: ${orderedIds.join(', ')}`);
      for (let i = 0; i < orderedIds.length; i++) {
        await updateChild(orderedIds[i], { displayOrder: String(i) });
      }
      console.log(`Ordine aggiornato per ${orderedIds.length} figli`);
      return res.json({ message: "Ordine aggiornato" });
    } catch (error) {
      console.error("Errore riordinamento figli:", error);
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.patch("/api/children/:childId/settings", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const childId = req.params.childId as string;
      const { salahEnabled, fastingEnabled, arabicLearnedLetters, hasHarakat, canReadArabic, canWriteArabic, akhlaqAdabChecked, trackQuranToday } = req.body;
      const data: any = {};
      if (typeof salahEnabled === "boolean") data.salahEnabled = salahEnabled;
      if (typeof fastingEnabled === "boolean") data.fastingEnabled = fastingEnabled;
      if (typeof arabicLearnedLetters === "string") data.arabicLearnedLetters = arabicLearnedLetters;
      if (typeof hasHarakat === "boolean") data.hasHarakat = hasHarakat;
      if (typeof canReadArabic === "boolean") data.canReadArabic = canReadArabic;
      if (typeof canWriteArabic === "boolean") data.canWriteArabic = canWriteArabic;
      if (typeof akhlaqAdabChecked === "string") data.akhlaqAdabChecked = akhlaqAdabChecked;
      if (typeof trackQuranToday === "boolean") data.trackQuranToday = trackQuranToday;

      const existingChildren = await getChildrenForUser(req.session.userId!);
      const existingChild = existingChildren.find(c => c.id === childId);

      if (typeof akhlaqAdabChecked === "string" && existingChild) {
        try {
          const newChecked: string[] = JSON.parse(akhlaqAdabChecked);
          const oldChecked: string[] = existingChild.akhlaqAdabChecked ? JSON.parse(existingChild.akhlaqAdabChecked) : [];
          const newlyAdded = newChecked.filter(item => !oldChecked.includes(item));
          if (newlyAdded.length > 0) {
            const user = await getUserById(req.session.userId!);
            const authorName = user?.name || "Genitore";
            const today = new Date().toISOString().split("T")[0];
            for (const item of newlyAdded) {
              await addActivityLog(childId, req.session.userId!, authorName, item, 'akhlaq', today);
            }
          }
        } catch {}
      }

      if (typeof arabicLearnedLetters === "string" && existingChild) {
        try {
          const newLetters: string[] = JSON.parse(arabicLearnedLetters);
          const oldLetters: string[] = existingChild.arabicLearnedLetters ? JSON.parse(existingChild.arabicLearnedLetters) : [];
          const newlyAdded = newLetters.filter(item => !oldLetters.includes(item));
          if (newlyAdded.length > 0) {
            const user = await getUserById(req.session.userId!);
            const authorName = user?.name || "Genitore";
            const today = new Date().toISOString().split("T")[0];
            for (const item of newlyAdded) {
              await addActivityLog(childId, req.session.userId!, authorName, item, 'arabo', today);
            }
          }
        } catch {}
      }

      const result = await updateChild(childId, data);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/children/:childId/education-feed", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const feed = await getEducationFeed(req.params.childId as string);
      return res.json(feed);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  // Quran Memorization
  app.get("/api/children/:childId/quran", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getQuranLogs(req.params.childId as string);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/quran", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { surahNumber, status } = req.body;
      if (!surahNumber) return res.status(400).json({ message: "surahNumber richiesto" });
      const result = await upsertQuranLog(req.params.childId as string, surahNumber, status || "not_started");
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  // Quran Daily Log
  app.get("/api/children/:childId/quran-daily/:date", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getQuranDailyLog(req.params.childId as string, req.params.date as string);
      return res.json(result || { completed: false, note: "" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/quran-daily", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { date, completed, note } = req.body;
      if (!date) return res.status(400).json({ message: "date richiesto" });
      const result = await upsertQuranDailyLog(req.params.childId as string, date, completed, note);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/children/:childId/aqidah", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const progress = await getAqidahProgress(req.params.childId as string);
      return res.json(progress);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/aqidah", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { itemKey, checked, note } = req.body;
      if (!itemKey) return res.status(400).json({ message: "itemKey richiesto" });
      const result = await upsertAqidahProgress(req.params.childId as string, itemKey, checked, note);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/children/:childId/akhlaq-notes", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const notes = await getAkhlaqNotes(req.params.childId as string);
      return res.json(notes);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/children/:childId/akhlaq-notes", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { itemKey, note } = req.body;
      if (!itemKey) return res.status(400).json({ message: "itemKey richiesto" });
      if (!note || !note.trim()) {
        await deleteAkhlaqNote(req.params.childId as string, itemKey);
        return res.json({ deleted: true });
      }
      const result = await upsertAkhlaqNote(req.params.childId as string, itemKey, note.trim());
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
