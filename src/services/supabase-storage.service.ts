import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { MaterialType } from '../common/enums/material-type.enum';

type UploadMaterialResult = {
  publicUrl: string;
  objectPath: string;
  fileSizeKb: number;
  fileType: MaterialType;
};

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClient | null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'materials';
    this.supabase =
      url && key
        ? createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;

    if (!this.supabase) {
      this.logger.warn(
        'Supabase Storage chưa được cấu hình. Upload materials bằng file sẽ không hoạt động cho đến khi cấu hình biến môi trường.',
      );
    }
  }

  async uploadMaterial(
    file: UploadedFile,
    lessonId: number,
    preferredFileName?: string,
  ): Promise<UploadMaterialResult> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        'Chưa cấu hình SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    if (!file?.buffer) {
      throw new BadRequestException('Không tìm thấy dữ liệu file để tải lên.');
    }

    const fileExt = extname(file.originalname || '').toLowerCase() || '';
    const objectPath = `lessons/${lessonId}/${Date.now()}-${randomUUID()}${fileExt}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        `Upload file lên Supabase thất bại: ${error.message}`,
      );
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(objectPath);

    if (!data?.publicUrl) {
      throw new InternalServerErrorException('Không lấy được public URL từ Supabase.');
    }

    return {
      publicUrl: data.publicUrl,
      objectPath,
      fileSizeKb: Math.max(1, Math.ceil((file.size || 0) / 1024)),
      fileType: this.detectMaterialType(file.mimetype),
    };
  }

  async deleteByPublicUrl(fileUrl?: string): Promise<void> {
    if (!fileUrl || !this.supabase) {
      return;
    }

    const objectPath = this.extractObjectPath(fileUrl);
    if (!objectPath) {
      return;
    }

    const { error } = await this.supabase.storage.from(this.bucket).remove([objectPath]);
    if (error) {
      this.logger.warn(
        `Không thể xóa file '${objectPath}' trên Supabase: ${error.message}`,
      );
    }
  }

  private extractObjectPath(fileUrl: string): string | null {
    try {
      const parsed = new URL(fileUrl);
      const marker = `/storage/v1/object/public/${this.bucket}/`;
      const pathWithQuery = parsed.pathname.split(marker)[1];

      if (!pathWithQuery) {
        return null;
      }

      return decodeURIComponent(pathWithQuery);
    } catch {
      return null;
    }
  }

  private detectMaterialType(mimeType?: string): MaterialType {
    if (!mimeType) {
      return MaterialType.DOCUMENT;
    }

    if (mimeType.startsWith('image/')) {
      return MaterialType.IMAGE;
    }

    if (mimeType.startsWith('video/')) {
      return MaterialType.VIDEO;
    }

    if (mimeType.startsWith('audio/')) {
      return MaterialType.AUDIO;
    }

    return MaterialType.DOCUMENT;
  }
}
