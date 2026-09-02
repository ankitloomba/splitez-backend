import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FinancesService } from './finances.service';
import {
  CreateIncomeDto,
  CreatePersonalExpenseDto,
} from './dto/finances.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('finances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finances')
export class FinancesController {
  constructor(private readonly finances: FinancesService) {}

  // ── Income ────────────────────────────────────────────────────────────

  @Get('income')
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listIncome(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.finances.listIncome(userId, cursor, limit ? +limit : 20);
  }

  @Post('income')
  createIncome(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateIncomeDto,
  ) {
    return this.finances.createIncome(userId, dto);
  }

  @Delete('income/:id')
  deleteIncome(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.finances.deleteIncome(userId, id);
  }

  // ── Personal Expenses ─────────────────────────────────────────────────

  @Get('expenses')
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listPersonalExpenses(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.finances.listPersonalExpenses(
      userId,
      cursor,
      limit ? +limit : 20,
    );
  }

  @Post('expenses')
  createPersonalExpense(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePersonalExpenseDto,
  ) {
    return this.finances.createPersonalExpense(userId, dto);
  }

  @Delete('expenses/:id')
  deletePersonalExpense(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.finances.deletePersonalExpense(userId, id);
  }

  // ── Summary ───────────────────────────────────────────────────────────

  @Get('summary')
  @ApiQuery({ name: 'month', required: false, example: '2026-09' })
  summary(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
  ) {
    return this.finances.summary(userId, month);
  }
}
