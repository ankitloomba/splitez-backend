import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { AddMembersDto, CreateGroupDto, UpdateGroupDto } from './dto/groups.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.groups.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGroupDto) {
    return this.groups.create(userId, dto);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.groups.get(userId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groups.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.groups.remove(userId, id);
  }

  @Post(':id/members')
  addMembers(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.groups.addMembers(userId, id, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('userId') memberId: string,
  ) {
    return this.groups.removeMember(userId, id, memberId);
  }
}
