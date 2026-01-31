import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type {
  Organization,
  Subscription,
  User,
  UserOrganization,
} from '@prisma/client';
import type { Response } from 'express';
import { PermissionList } from '@growchief/shared-backend/billing/permissions.list';
import { UsersService } from '@growchief/shared-backend/database/users/users.service';
import { GetUserFromRequest } from '@growchief/backend/services/auth/user.from.request';
import { AcceptOrDeclineInviteDto } from '@growchief/shared-both/dto/team/accept.or.decline.invite.dto';
import { GetOrganizationFromRequest } from '@growchief/backend/services/auth/org.from.request';
import { getUrlFromDomain } from '@growchief/shared-both/utils/get.url.from.domain';

@Controller('/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    public permissionList: PermissionList,
    private _userService: UsersService,
  ) {}

  @Get('/invites')
  async getInvites(@GetUserFromRequest() user: User) {
    return this._userService.getInvites(user.email);
  }

  @Post('/invite/:id')
  async acceptOrDeclineInvite(
    @Param('id') id: string,
    @GetUserFromRequest() user: User,
    @Body() body: AcceptOrDeclineInviteDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const invite = await this._userService.acceptOrDeclineInvite(
      id,
      user.id,
      user.email,
      body,
    );

    if (body.action === 'accept') {
      const cookieOpts: any = {
        secure: true,
        httpOnly: true,
        sameSite: 'none',
      };
      const domain = getUrlFromDomain(process.env.FRONTEND_URL!);
      if (domain) cookieOpts.domain = domain;
      response.cookie('showorg', invite.organizationId, cookieOpts);
    }

    return invite;
  }

  @Get('/self')
  async self(
    @GetUserFromRequest() user: User,
    @GetOrganizationFromRequest()
    org: Organization & {
      subscription?: Subscription;
      users: UserOrganization[];
    },
  ) {
    const freshUser = await this._userService.getUserById(user.id);
    const isSuperAdmin = freshUser?.isSuperAdmin ?? user.isSuperAdmin ?? false;

    if (freshUser && freshUser.isSuperAdmin !== user.isSuperAdmin) {
      this.logger.log(
        `isSuperAdmin sync: userId=${user.id} email=${user.email} jwt=${user.isSuperAdmin} db=${freshUser.isSuperAdmin} -> using db`,
      );
    }

    const roles =
      !org.subscription || !org.users?.[0]
        ? undefined
        : this.permissionList.list.reduce((all, current) => {
            const permission = current.definitions.find(
              (p) => p.identifier === org.subscription?.identifier,
            );

            return {
              ...all,
              [current.identifier]: {
                enabled: !!(
                  permission?.enabled &&
                  current.level.indexOf(org.users[0].role) > -1
                ),
                total: permission?.total,
              },
            };
          }, {});

    return {
      ...user,
      isSuperAdmin,
      org,
      roles,
      selfhosted: !process.env.BILLING_PROVIDER,
    };
  }

  @Post('/logout')
  logout(@Res({ passthrough: true }) response: Response) {
    const opts: any = {
      expires: new Date(Date.now() - 10000),
      secure: true,
      httpOnly: true,
      sameSite: 'none',
    };
    const domain = getUrlFromDomain(process.env.FRONTEND_URL!);
    if (domain) opts.domain = domain;
    response.cookie('auth', '', opts);

    return { success: true };
  }

  @Get('/all-users')
  async getAllUsers(@Query() query: { search: string }) {
    return this._userService.getAllUsers(query.search);
  }
}
