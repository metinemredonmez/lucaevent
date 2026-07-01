import {
  BadRequestException,
  Body,
  Controller,
  Injectable,
  Module,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Role } from '@prisma/client';
import { createHash, createHmac, randomBytes } from 'node:crypto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SettingsService } from '../settings/settings.service';

// İzin verilen içerik tipleri — güvenlik: SVG/HTML gibi script taşıyabilen tipler DIŞARIDA.
const ALLOWED_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/x-mpegurl',
  'application/vnd.apple.mpegurl',
]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO_BYTES = 600 * 1024 * 1024; // 600 MB

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

  @ApiPropertyOptional({ description: 'Dosya boyutu (byte) — limit kontrolü için' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2 * 1024 * 1024 * 1024)
  size?: number;
}

/**
 * Presigned R2/S3 PUT URLs (AWS Signature V4, dependency-free). The client
 * (admin UI) PUTs the file straight to storage, then saves the returned
 * publicUrl onto the event/media. No file bytes pass through the API.
 * Config admin-managed (Ayarlar → Depolama), env fallback (S3_*). Content-Type
 * imzaya dahil edilir → yüklenen nesnenin tipi bağlanır (defense-in-depth).
 */
@Injectable()
export class UploadsService {
  constructor(private readonly settings: SettingsService) {}

  private async cfg() {
    return {
      endpoint: (await this.settings.get('storage.endpoint')).replace(/\/$/, ''),
      bucket: await this.settings.get('storage.bucket'),
      accessKey: await this.settings.get('storage.accessKeyId'),
      secretKey: await this.settings.get('storage.secretAccessKey'),
      region: (await this.settings.get('storage.region')) || 'auto',
      publicUrl: (await this.settings.get('storage.publicBaseUrl')).replace(/\/$/, ''),
    };
  }

  async presignUpload(filename: string, contentType: string, folder = 'uploads', size?: number) {
    if (!ALLOWED_TYPES.has(contentType)) {
      throw new BadRequestException('Bu dosya tipine izin verilmiyor (yalnız görsel/video).');
    }
    const isVideo = contentType.startsWith('video/') || contentType.includes('mpegurl');
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (size != null && size > maxBytes) {
      throw new BadRequestException(
        `Dosya çok büyük (max ${Math.round(maxBytes / 1024 / 1024)} MB).`,
      );
    }

    const c = await this.cfg();
    if (!c.endpoint || !c.bucket || !c.accessKey || !c.secretKey) {
      throw new ServiceUnavailableException('Depolama yapılandırılmadı (Ayarlar → Depolama).');
    }
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const folderSafe = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';
    const key = `${folderSafe}/${Date.now()}-${randomBytes(4).toString('hex')}-${safe}`;
    const uploadUrl = this.presignPut(c, key, contentType, 900);
    const publicUrl = c.publicUrl
      ? `${c.publicUrl}/${key}`
      : `${c.endpoint}/${c.bucket}/${key}`;
    return { key, uploadUrl, publicUrl, contentType, method: 'PUT', expiresInSec: 900, maxBytes };
  }

  // Content-Type imzaya dahil (signedHeaders='content-type;host') → client aynı Content-Type ile PUT etmeli.
  private presignPut(
    c: { endpoint: string; bucket: string; accessKey: string; secretKey: string; region: string },
    key: string,
    contentType: string,
    expires: number,
  ): string {
    const host = new URL(c.endpoint).host;
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const service = 's3';
    const scope = `${dateStamp}/${c.region}/${service}/aws4_request`;
    const algorithm = 'AWS4-HMAC-SHA256';
    const signedHeaders = 'content-type;host';
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

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
    const canonicalRequest = [
      'PUT',
      canonicalUri,
      canonicalQuery,
      canonicalHeaders,
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
    return this.uploads.presignUpload(dto.filename, dto.contentType, dto.folder, dto.size);
  }
}

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
