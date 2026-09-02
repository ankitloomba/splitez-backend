import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/settlements.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('settlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get()
  @ApiQuery({ name: 'groupId', required: false })
  list(
    @CurrentUser('id') userId: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.settlements.list(userId, groupId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSettlementDto) {
    return this.settlements.create(userId, dto);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.settlements.get(userId, id);
  }
}
