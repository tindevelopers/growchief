import { Role } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@growchief/shared-backend/database/prisma';
import { CreateOrgUserDto } from '@growchief/shared-both/dto/auth/create.org.user.dto';
import { EncryptionService } from '@growchief/shared-backend/encryption/encryption.service';

@Injectable()
export class OrganizationRepository {
  constructor(
    private _organization: PrismaRepository<'organization'>,
    private _userOrg: PrismaRepository<'userOrganization'>,
    private _user: PrismaRepository<'user'>,
    private _invite: PrismaRepository<'invites'>,
  ) {}

  getCount() {
    return this._organization.model.organization.count();
  }

  async getOrgsByUserId(userId: string) {
    return this._organization.model.organization.findMany({
      where: {
        users: {
          some: {
            userId,
          },
        },
      },
      include: {
        users: {
          where: {
            userId,
          },
          select: {
            id: true,
            disabled: true,
            role: true,
          },
        },
        subscription: true,
      },
    });
  }

  async createOrPromoteSuperAdmin(email: string, password: string) {
    const existing = await this._user.model.user.findFirst({
      where: { email, providerName: 'LOCAL' },
      include: { organizations: true },
    });
    if (existing) {
      await this._user.model.user.update({
        where: { id: existing.id },
        data: { isSuperAdmin: true },
      });
      await this._userOrg.model.userOrganization.updateMany({
        where: { userId: existing.id },
        data: { role: Role.SUPERADMIN },
      });
      return { created: false, email };
    }
    const org = await this._organization.model.organization.create({
      data: {
        companyName: 'Super Admin',
        allowTrial: true,
        botGroups: { create: { name: 'Default', active: true } },
        users: {
          create: {
            role: Role.SUPERADMIN,
            user: {
              create: {
                email,
                password: EncryptionService.hashPassword(password),
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
    return { created: true, email, organizationId: org.id };
  }

  async createOrgAndUser(
    body: Omit<CreateOrgUserDto, 'providerToken' | 'website'> & {
      providerId?: string;
    },
    hasEmail: boolean,
  ) {
    const totalUsers = await this.getCount();
    return this._organization.model.organization.create({
      data: {
        companyName: body.company,
        allowTrial: true,
        botGroups: {
          create: {
            name: 'Default',
            active: true,
          },
        },
        users: {
          create: {
            role: Role.SUPERADMIN,
            user: {
              create: {
                isSuperAdmin: totalUsers === 0,
                activated: body.provider !== 'LOCAL' || !hasEmail,
                email: body.email,
                password: body.password
                  ? EncryptionService.hashPassword(body.password)
                  : '',
                providerName: body.provider,
                providerId: body.providerId || '',
              },
            },
          },
        },
      },
      select: {
        id: true,
        users: {
          select: {
            user: true,
          },
        },
      },
    });
  }

  async addUserToOrg(
    userId: string,
    id: string,
    orgId: string,
    role: 'USER' | 'ADMIN',
  ) {
    const create = await this._userOrg.model.userOrganization.create({
      data: {
        role,
        userId,
        organizationId: orgId,
      },
    });

    return create;
  }

  getOrganizationByPaymentId(paymentId: string) {
    return this._organization.model.organization.findFirst({
      where: {
        paymentId,
      },
    });
  }

  listUsersPerOrganization(org: string) {
    return this._userOrg.model.userOrganization.findMany({
      where: {
        organizationId: org,
      },
      select: {
        role: true,
        user: {
          select: {
            email: true,
            id: true,
          },
        },
      },
    });
  }

  listInvitesPerOrganization(org: string) {
    return this._invite.model.invites.findMany({
      where: {
        organizationId: org,
        status: {
          in: ['PENDING', 'REJECTED'],
        },
      },
      select: {
        email: true,
        role: true,
        status: true,
      },
    });
  }

  inviteMember(org: string, email: string, role: Role) {
    return this._invite.model.invites.upsert({
      where: {
        email_organizationId: {
          email,
          organizationId: org,
        },
        status: {
          in: ['PENDING', 'REJECTED'],
        },
      },
      create: {
        email,
        organizationId: org,
        role,
        status: 'PENDING',
      },
      update: {
        email,
        organizationId: org,
        role,
        status: 'PENDING',
      },
    });
  }

  async deleteMember(org: string, email: string) {
    await this._invite.model.invites.deleteMany({
      where: {
        email,
        organizationId: org,
      },
    });

    await this._userOrg.model.userOrganization.deleteMany({
      where: {
        organizationId: org,
        user: {
          email,
        },
      },
    });
  }

  getOrgByApiKey(api: string) {
    return this._organization.model.organization.findFirst({
      where: {
        apiKey: api,
      },
      include: {
        subscription: {
          select: {
            id: true,
          },
        },
      },
    });
  }
}
