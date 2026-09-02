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
import { TripsService } from './trips.service';
import {
  AddTripMembersDto,
  CreateTripDto,
  UpdateTripDto,
} from './dto/trips.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.trips.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTripDto) {
    return this.trips.create(userId, dto);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.trips.get(userId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.trips.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.trips.remove(userId, id);
  }

  @Post(':id/members')
  addMembers(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddTripMembersDto,
  ) {
    return this.trips.addMembers(userId, id, dto);
  }
}
