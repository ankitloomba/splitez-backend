import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expenses.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'tripId', required: false })
  list(
    @CurrentUser('id') userId: string,
    @Query('groupId') groupId?: string,
    @Query('tripId') tripId?: string,
  ) {
    if (groupId) return this.expenses.listByGroup(userId, groupId);
    if (tripId) return this.expenses.listByTrip(userId, tripId);
    return this.expenses.listByUser(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(userId, dto);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.expenses.get(userId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenses.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.expenses.remove(userId, id);
  }
}
