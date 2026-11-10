/**
 * Creates the first super_admin from SEED_ADMIN_PHONE and SEED_ADMIN_PASSWORD.
 * Run with `npm run seed:admin` after the app has started once (synchronize creates the tables).
 * Safe to run again: an existing super_admin with that phone is left unchanged.
 */
import "reflect-metadata";
import * as bcrypt from "bcrypt";
import { config as loadEnv } from "dotenv";
import { DataSource } from "typeorm";
import { UserRole } from "../common/enums";
import { School } from "../modules/school/schools/entities/school.entity";
import { User } from "../modules/identity/users/entities/user.entity";
import { BCRYPT_ROUNDS } from "../modules/identity/users/users.service";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set in .env`);
  return value;
}

async function main() {
  loadEnv(); // same parser as @nestjs/config
  const phone = required("SEED_ADMIN_PHONE");
  const password = required("SEED_ADMIN_PASSWORD");
  if (password.length < 8)
    throw new Error("SEED_ADMIN_PASSWORD must have at least 8 characters");

  const dataSource = new DataSource({
    type: "postgres",
    host: required("PG_HOST"),
    port: Number(required("PG_PORT")),
    username: required("PG_USER"),
    password: required("PG_PASSWORD"),
    database: required("PG_DB"),
    entities: [User, School],
  });
  await dataSource.initialize();
  try {
    const [{ exists }] = await dataSource.query(
      "SELECT to_regclass('public.users') IS NOT NULL AS exists",
    );
    if (!exists) {
      throw new Error(
        "Table users does not exist yet; start the app once so the schema is created",
      );
    }
    const users = dataSource.getRepository(User);
    const existing = await users.findOne({ where: { phone } });
    if (existing) {
      if (existing.role !== UserRole.SUPER_ADMIN) {
        throw new Error(
          `Phone ${phone} already belongs to a ${existing.role} (user ${existing.id})`,
        );
      }
      console.log(
        `super_admin already exists: user ${existing.id} (${phone}); nothing changed`,
      );
      return;
    }
    const admin = await users.save(
      users.create({
        role: UserRole.SUPER_ADMIN,
        schoolId: null,
        firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim() || "Super",
        lastName: process.env.SEED_ADMIN_LAST_NAME?.trim() || "Admin",
        phone,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        isActive: true,
      }),
    );
    console.log(`Created super_admin: user ${admin.id} (${phone})`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: Error) => {
  console.error(`seed:admin failed: ${error.message}`);
  process.exit(1);
});
