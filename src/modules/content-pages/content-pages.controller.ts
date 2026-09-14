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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentPagesService } from './content-pages.service';
import {
  CreateContentPageDto,
  UpdateContentPageDto,
} from './dto/content-page.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

// ── Public endpoints (for the mobile app) ─────────────────────────────
@ApiTags('Content Pages')
@Controller('pages')
export class ContentPagesController {
  constructor(private readonly svc: ContentPagesService) {}

  @Get()
  @ApiOperation({ summary: 'List published content pages' })
  list(@Query('category') category?: string) {
    return this.svc.listPublished(category);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published page by slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.svc.getBySlug(slug);
  }
}

// ── Admin endpoints ───────────────────────────────────────────────────
@ApiTags('Admin – Content Pages')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/content-pages')
export class ContentPagesAdminController {
  constructor(private readonly svc: ContentPagesService) {}

  @Get()
  @ApiOperation({ summary: 'List all content pages (admin)' })
  list() {
    return this.svc.listAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content page by id (admin)' })
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create content page' })
  create(@Body() dto: CreateContentPageDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update content page' })
  update(@Param('id') id: string, @Body() dto: UpdateContentPageDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete content page' })
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
