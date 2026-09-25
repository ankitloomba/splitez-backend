import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SupportService } from './support.service';
import { CreateEnquiryDto } from './support.dto';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('enquiries')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a contact / support enquiry' })
  create(@Body() dto: CreateEnquiryDto, @Request() req: any) {
    return this.supportService.createEnquiry(dto, req.user?.id);
  }
}
