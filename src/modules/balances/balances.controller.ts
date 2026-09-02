import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BalancesService } from './balances.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('balances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('balances')
export class BalancesController {
  constructor(private readonly balances: BalancesService) {}

  @Get()
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'tripId', required: false })
  getBalances(
    @CurrentUser('id') userId: string,
    @Query('groupId') groupId?: string,
    @Query('tripId') tripId?: string,
  ) {
    return this.balances.getBalances(userId, { groupId, tripId });
  }

  @Get('simplified')
  @ApiQuery({ name: 'groupId', required: true })
  getSimplifiedDebts(@Query('groupId') groupId: string) {
    return this.balances.getSimplifiedDebts(groupId);
  }
}
