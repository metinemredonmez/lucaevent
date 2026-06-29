import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { SubmissionsService } from './submissions.service';
import {
  CreateSubmissionDto,
  SubmissionQueryDto,
  UpdateSubmissionDto,
} from './dto/submission.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('submissions')
@Controller()
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  /** Public — herkes form gönderebilir (rate-limit global ThrottlerGuard ile). */
  @Public()
  @Post('submissions')
  create(@Body() dto: CreateSubmissionDto) {
    return this.submissions.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Get('admin/submissions')
  list(@Query() q: SubmissionQueryDto) {
    return this.submissions.list(q);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Patch('admin/submissions/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSubmissionDto) {
    return this.submissions.setStatus(id, dto.status);
  }
}
