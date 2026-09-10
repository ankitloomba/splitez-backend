import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exports: ExportsService) {}

  @Get('expenses/csv')
  async expensesCsv(
    @CurrentUser('id') userId: string,
    @Query('groupId') groupId?: string,
    @Query('tripId') tripId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.exports.expensesCsv(userId, { groupId, tripId, from, to });
    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader('Content-Disposition', 'attachment; filename="splitez-expenses.csv"');
    res!.send(csv);
  }

  @Get('expenses/pdf')
  async expensesPdf(
    @CurrentUser('id') userId: string,
    @Query('groupId') groupId?: string,
    @Query('tripId') tripId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const pdf = await this.exports.expensesPdf(userId, { groupId, tripId, from, to });
    res!.setHeader('Content-Type', 'application/pdf');
    res!.setHeader('Content-Disposition', 'attachment; filename="splitez-expenses.pdf"');
    res!.send(pdf);
  }

  @Get('settlements/csv')
  async settlementsCsv(
    @CurrentUser('id') userId: string,
    @Query('groupId') groupId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.exports.settlementsCsv(userId, { groupId, from, to });
    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader('Content-Disposition', 'attachment; filename="splitez-settlements.csv"');
    res!.send(csv);
  }
}
