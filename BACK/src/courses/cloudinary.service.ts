import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  readonly enabled: boolean;

  constructor(config: ConfigService) {
    const cloud_name = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const api_key = config.get<string>('CLOUDINARY_API_KEY');
    const api_secret = config.get<string>('CLOUDINARY_API_SECRET');
    this.enabled = Boolean(cloud_name && api_key && api_secret);
    if (this.enabled) cloudinary.config({ cloud_name, api_key, api_secret });
    else this.logger.warn('Cloudinary is not configured: file uploads are disabled');
  }

  upload(file: Express.Multer.File): Promise<UploadApiResponse> {
    if (!this.enabled) {
      throw new BadRequestException('File upload is not configured, please share a link instead');
    }
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: 'auto', folder: 'faceatutor/courses', use_filename: true },
          (error, result) => (error || !result ? reject(error) : resolve(result)),
        )
        .end(file.buffer);
    });
  }
}
