import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { PrismaClient } = require("../generated/prisma/index.js");

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pkg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
