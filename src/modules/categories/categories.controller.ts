import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, MaxLength } from 'class-validator';

class CreateCategoryDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;
}

class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;
}

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.categories.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCategoryDto) {
    return this.categories.create(userId, dto.name, dto.icon);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(userId, id, dto.name, dto.icon);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.categories.delete(userId, id);
  }
}
