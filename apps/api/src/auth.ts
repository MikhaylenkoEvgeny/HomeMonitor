import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { nanoid } from "nanoid";
import type { Invite, Role } from "@homemonitor/types";

const scrypt = promisify(scryptCallback);

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

export class AuthService {
  private readonly users = new Map<string, UserRecord>();
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly invites = new Map<string, Invite>();

  ownerExists(): boolean {
    return Array.from(this.users.values()).some((user) => user.role === "owner");
  }

  async seedOwner(email?: string, password?: string): Promise<void> {
    if (!email || !password || this.ownerExists()) {
      return;
    }

    await this.bootstrapOwner(email, password);
  }

  async bootstrapOwner(email: string, password: string): Promise<{ id: string; email: string; role: Role }> {
    if (this.ownerExists()) {
      throw new Error("Owner already exists");
    }

    const user = await this.createUser(email, password, "owner");
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string): Promise<{ token: string; expiresAt: string; role: Role }> {
    const user = this.users.get(email.toLowerCase());
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new Error("Invalid email or password");
    }

    const token = nanoid(48);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
    this.sessions.set(token, { token, userId: user.id, expiresAt });
    return { token, expiresAt, role: user.role };
  }

  getSession(token: string | undefined): SessionRecord | undefined {
    if (!token) {
      return undefined;
    }

    const session = this.sessions.get(token);
    if (!session || Date.parse(session.expiresAt) <= Date.now()) {
      return undefined;
    }

    return session;
  }

  createInvite(email: string, role: Role): Invite {
    const invite: Invite = {
      id: nanoid(),
      email: email.toLowerCase(),
      role,
      token: nanoid(36),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
    };
    this.invites.set(invite.token, invite);
    return invite;
  }

  listInvites(): Invite[] {
    return Array.from(this.invites.values());
  }

  private async createUser(email: string, password: string, role: Role): Promise<UserRecord> {
    const normalizedEmail = email.toLowerCase();
    if (this.users.has(normalizedEmail)) {
      throw new Error("User already exists");
    }

    const user: UserRecord = {
      id: nanoid(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role,
      createdAt: new Date().toISOString()
    };
    this.users.set(normalizedEmail, user);
    return user;
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) {
    return false;
  }

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
