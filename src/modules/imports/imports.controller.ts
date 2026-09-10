import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  /**
   * Upload a CSV or Excel file to import expenses.
   * Supports Splitwise export format and generic columns:
   *   Date, Description, Amount/Cost, Category, Currency
   */
  @Post('expenses')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/octet-stream',
        ];
        if (
          allowed.includes(file.mimetype) ||
          /\.(csv|xlsx|xls)$/i.test(file.originalname)
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV and Excel files are supported'), false);
        }
      },
    }),
  )
  async importExpenses(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('groupId') groupId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.imports.importFile(userId, file, groupId);
  }
}
