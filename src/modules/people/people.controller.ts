import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { AddPersonDto, InvitePersonDto } from './dto/people.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('people')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.people.list(userId);
  }

  @Get('search')
  search(@CurrentUser('id') userId: string, @Query('q') q?: string) {
    return this.people.search(userId, q);
  }

  @Post()
  add(@CurrentUser('id') userId: string, @Body() dto: AddPersonDto) {
    return this.people.add(userId, dto);
  }

  @Post('invite')
  invite(@CurrentUser('id') userId: string, @Body() dto: InvitePersonDto) {
    return this.people.invite(userId, dto);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.people.get(userId, id);
  }
}
