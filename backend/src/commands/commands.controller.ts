import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CommandsService } from './commands.service';
import { SendCommandDto } from './dto/send-command.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('commands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Post()
  @Roles(Role.OPERATOR, Role.ADMIN)
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendCommandDto) {
    return this.commandsService.send(user.sub, dto);
  }
}
