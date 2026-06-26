import {
  Body,
  Controller,
  Injectable,
  Module,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';
import { createHash, createHmac, randomBytes } from 'node:crypto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class PresignDto {
  @ApiProperty({ example: 'cover.jpg' })
  @IsString()
  @MaxLength(120)
  filename!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @Matches(/^[\w.+-]+\/[\w.+-]+$/, { message: 'contentType MIME formatında olmalı' })
  contentType!: string;

  @ApiPropertyOptional({ description: 'Klasör (varsayılan: uploads)' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  folder?: string;
}

/**
 * Presigned S3/MinIO PUT URLs (AWS Signature V4, dependency-free). The client
 * (admin UI) PUTs the file straight to storage, then saves the returned
 * publicUrl onto the event/media. No file bytes pass through the API.
 */
@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  private cfg() {
    return {
      endpoint: (this.config.get<string>('S3_ENDPOINT') || '').replace(/\/$/, ''),
      bucket: this.config.get<string>('S3_BUCKET') || '',
      accessKey: this.config.get<string>('S3_ACCESS_KEY') || '',
      secretKey: this.config.get<string>('S3_SECRET_KEY') || '',
      region: this.config.get<string>('S3_REGION') || 'us-east-1',
      publicUrl: (this.config.get<string>('S3_PUBLIC_URL') || '').replace(/\/$/, ''),
    };
  }

  presignUpload(filename: string, contentType: string, folder = 'uploads') {
    const c = this.cfg();
    if (!c.endpoint || !c.bucket || !c.accessKey || !c.secretKey) {
      throw new ServiceUnavailableException('Storage is not configured');
    }
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const folderSafe = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';
    const key = `${folderSafe}/${Date.now()}-${randomBytes(4).toString('hex')}-${safe}`;
    const uploadUrl = this.presignPut(c, key, 900);
    const publicUrl = c.publicUrl
      ? `${c.publicUrl}/${key}`
      : `${c.endpoint}/${c.bucket}/${key}`;
    return { key, uploadUrl, publicUrl, contentType, method: 'PUT', expiresInSec: 900 };
  }

  private presignPut(
    c: { endpoint: string; bucket: string; accessKey: string; secretKey: string; region: string },
    key: string,
    expires: number,
  ): string {
    const host = new URL(c.endpoint).host;
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const service = 's3';
    const scope = `${dateStamp}/${c.region}/${service}/aws4_request`;
    const algorithm = 'AWS4-HMAC-SHA256';
    const signedHeaders = 'host';
    const canonicalUri = `/${c.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;

    const query: Record<string, string> = {
      'X-Amz-Algorithm': algorithm,
      'X-Amz-Credential': `${c.accessKey}/${scope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expires),
      'X-Amz-SignedHeaders': signedHeaders,
    };
    const canonicalQuery = Object.keys(query)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
      .join('&');

    const canonicalRequest = [
      'PUT',
      canonicalUri,
      canonicalQuery,
      `host:${host}\n`,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      algorithm,
      amzDate,
      scope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const hmac = (k: Buffer | string, d: string) =>
      createHmac('sha256', k).update(d).digest();
    const kDate = hmac('AWS4' + c.secretKey, dateStamp);
    const kRegion = hmac(kDate, c.region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `${c.endpoint}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  }
}

@ApiTags('admin/uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('presign')
  presign(@Body() dto: PresignDto) {
    return this.uploads.presignUpload(dto.filename, dto.contentType, dto.folder);
  }
}

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
