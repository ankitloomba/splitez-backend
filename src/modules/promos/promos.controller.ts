import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PromosService } from './promos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('promos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('promos')
export class PromosController {
  constructor(private readonly promos: PromosService) {}

  @Get()
  @ApiQuery({ name: 'screen', required: false })
  list(@Query('screen') screen?: string) {
    return this.promos.list(screen);
  }
}
