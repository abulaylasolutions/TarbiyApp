import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByInviteCode,
  updateUserProfile,
  updateUserPremium,
  pairCogenitori,
  unpairCogenitore,
  getChildrenForUser,
  addChild,
  removeChild,
  getNotesForUser,
  addNote,
  removeNote,
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

      const currentUser = await getUserById(req.session.userId!);
      if (currentUser?.pairedCogenitore) {
        return res.status(400).json({ message: "Sei già collegato con un cogenitore. Rimuovi prima il collegamento attuale." });
      }

      if (targetUser.pairedCogenitore) {
        return res.status(400).json({ message: "Questo utente è già collegato con un altro cogenitore" });
      }

      await pairCogenitori(req.session.userId!, targetUser.id);

      const { password: _, ...safeTarget } = targetUser;
      return res.json({ message: "Cogenitore collegato con successo!", cogenitore: safeTarget });
    } catch (error) {
      console.error("Pair error:", error);
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/cogenitore/unpair", requireAuth as any, async (req: Request, res: Response) => {
    try {
      await unpairCogenitore(req.session.userId!);
      return res.json({ message: "Collegamento rimosso" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/cogenitore", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const user = await getUserById(req.session.userId!);
      if (!user?.pairedCogenitore) {
        return res.json({ paired: false, cogenitore: null });
      }
      const partner = await getUserById(user.pairedCogenitore);
      if (!partner) {
        return res.json({ paired: false, cogenitore: null });
      }
      const { password: _, ...safePartner } = partner;
      return res.json({ paired: true, cogenitore: safePartner });
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
      const { name, birthDate, photoUri } = req.body;
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

      const child = await addChild(req.session.userId!, name, birthDate, photoUri);
      return res.status(201).json(child);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.delete("/api/children/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      await removeChild(req.params.id);
      return res.json({ message: "Figlio rimosso" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.get("/api/notes", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const result = await getNotesForUser(req.session.userId!);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/notes", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { text, color, rotation, author } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Testo richiesto" });
      }
      const note = await addNote(req.session.userId!, text, color || "#FFD3B6", rotation || "0", author || "Genitore");
      return res.status(201).json(note);
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  app.delete("/api/notes/:id", requireAuth as any, async (req: Request, res: Response) => {
    try {
      await removeNote(req.params.id);
      return res.json({ message: "Nota rimossa" });
    } catch (error) {
      return res.status(500).json({ message: "Errore del server" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
