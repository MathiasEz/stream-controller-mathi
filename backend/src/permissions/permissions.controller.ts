import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { GrantPermissionDto } from './dto/grant-permission.dto';
import { PermissionsService } from './permissions.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post('grant')
  @Roles(Role.STREAMER, Role.ADMIN)
  grant(@CurrentUser() user: AuthenticatedUser, @Body() dto: GrantPermissionDto) {
    return this.permissionsService.grant(user.sub, dto);
  }

  @Delete(':operatorId')
  @Roles(Role.STREAMER, Role.ADMIN)
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('operatorId') operatorId: string) {
    return this.permissionsService.revoke(user.sub, operatorId);
  }
}
