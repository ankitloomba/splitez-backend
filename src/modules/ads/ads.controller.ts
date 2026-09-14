import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  /** Client-facing: get ad config for a screen. */
  @Get('placements')
  @ApiOperation({ summary: 'Get ad placements for a screen (client)' })
  getPlacements(
    @Query('screen') screen: string = 'home',
    @Query('platform') platform: string = 'ios',
  ) {
    return this.ads.getPlacementsForScreen(screen, platform);
  }
}

@ApiTags('Admin – Ads')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/ads')
export class AdsAdminController {
  constructor(private readonly ads: AdsService) {}

  @Get()
  @ApiOperation({ summary: 'List all ad placements (admin)' })
  listAll() {
    return this.ads.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create an ad placement' })
  create(@Body() body: any) {
    return this.ads.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an ad placement' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.ads.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an ad placement' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ads.remove(id);
  }
}
