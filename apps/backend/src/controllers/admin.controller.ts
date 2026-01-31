import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationService } from '@growchief/shared-backend/database/organizations/organization.service';

@Controller('/admin')
export class AdminController {
  constructor(private _organizationService: OrganizationService) {}

  @Post('create-superadmin')
  @HttpCode(HttpStatus.OK)
  async createSuperAdmin(
    @Body() body: { email?: string; password?: string; secret?: string },
  ) {
    const secret = process.env.ADMIN_SECRET;
    if (!secret || body.secret !== secret) {
      throw new UnauthorizedException('Invalid secret');
    }
    const email = body.email || 'superadmin@tin.info';
    const password = body.password || '88888888';
    const result = await this._organizationService.createOrPromoteSuperAdmin(
      email,
      password,
    );
    return { ok: true, ...result };
  }
}
