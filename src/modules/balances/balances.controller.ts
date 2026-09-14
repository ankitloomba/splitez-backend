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
  async getBalances(
    @CurrentUser('id') userId: string,
    @Query('groupId') groupId?: string,
    @Query('tripId') tripId?: string,
  ) {
    const entries = await this.balances.getBalances(userId, { groupId, tripId });
    return entries.map((e) => ({
      userId: e.userId,
      user: {
        id: e.userId,
        firstName: e.firstName,
        lastName: e.lastName,
        profilePicture: e.profilePicture,
        avatar: e.avatar,
      },
      amount: e.netAmount,
    }));
  }

  @Get('simplified')
  @ApiQuery({ name: 'groupId', required: true })
  getSimplifiedDebts(@Query('groupId') groupId: string) {
    return this.balances.getSimplifiedDebts(groupId);
  }
}
