import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const COLLECTION_LAYOUTS = [
  'cinema',
  'numbered',
  'poster',
  'featured',
] as const;
export type CollectionLayout = (typeof COLLECTION_LAYOUTS)[number];

export class CreateCollectionDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @ApiPropertyOptional({ enum: CollectionStatus })
  @IsOptional()
  @IsEnum(CollectionStatus)
  status?: CollectionStatus;

  @ApiPropertyOptional({ enum: COLLECTION_LAYOUTS })
  @IsOptional()
  @IsIn(COLLECTION_LAYOUTS as unknown as string[])
  layout?: CollectionLayout;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;
}

export class UpdateCollectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @ApiPropertyOptional({ enum: CollectionStatus })
  @IsOptional()
  @IsEnum(CollectionStatus)
  status?: CollectionStatus;

  @ApiPropertyOptional({ enum: COLLECTION_LAYOUTS })
  @IsOptional()
  @IsIn(COLLECTION_LAYOUTS as unknown as string[])
  layout?: CollectionLayout;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;
}

export class AddCollectionItemsDto {
  @ApiProperty({
    description: 'YouTube adresleri — satır satır veya dizi olarak.',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  urls!: string[];
}

export class ReorderCollectionItemsDto {
  @ApiProperty({ description: 'Item id\'leri — istenen sırada.', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];
}
