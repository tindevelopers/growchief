#!/usr/bin/env node
/**
 * Creates or promotes a user to superadmin.
 * Usage: node scripts/create-superadmin.mjs [email] [password]
 * Default: superadmin@tin.info / 88888888
 *
 * For Railway: Use DATABASE_PUBLIC_URL in .env (from Postgres service)
 * when running locally, since DATABASE_URL uses internal hostname.
 */
import 'dotenv/config';

// Use public URL for local runs when DB is on Railway (before Prisma loads)
if (process.env.DATABASE_PUBLIC_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
}

import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcrypt';

const email = process.argv[2] || 'superadmin@tin.info';
const password = process.argv[3] || '88888888';

const prisma = new PrismaClient();

async function main() {

  const hashedPassword = hashSync(password, 10);

  const existing = await prisma.user.findFirst({
    where: { email, providerName: 'LOCAL' },
    include: { organizations: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { isSuperAdmin: true },
    });
    await prisma.userOrganization.updateMany({
      where: { userId: existing.id },
      data: { role: 'SUPERADMIN' },
    });
    console.log(`Updated ${email} to superadmin`);
  } else {
    const org = await prisma.organization.create({
      data: {
        companyName: 'Super Admin',
        allowTrial: true,
        botGroups: {
          create: { name: 'Default', active: true },
        },
        users: {
          create: {
            role: 'SUPERADMIN',
            user: {
              create: {
                email,
                password: hashedPassword,
                providerName: 'LOCAL',
                providerId: '',
                isSuperAdmin: true,
                activated: true,
              },
            },
          },
        },
      },
    });
    console.log(`Created superadmin ${email} with organization ${org.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
