import { Injectable, Logger, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class R2StorageService implements OnModuleInit {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('Initializing R2StorageService...');
    
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    let endpoint = this.configService.get<string>('R2_ENDPOINT');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      const msg = 'Missing Cloudflare R2 credentials in environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).';
      this.logger.error(msg);
      throw new InternalServerErrorException(msg);
    }

    if (!endpoint) {
      endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    }

    this.bucketName = bucketName;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`R2StorageService initialized for bucket: ${this.bucketName}`);
  }

  async upload(objectKey: string, buffer: Buffer, mimeType: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
      this.logger.log(`File uploaded successfully to R2: ${objectKey}`);
    } catch (error: any) {
      this.logger.error(`Error uploading file to R2: ${objectKey}`, error.stack);
      throw new InternalServerErrorException(`Failed to upload file to R2: ${error.message}`);
    }
  }

  async download(objectKey: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error: any) {
      this.logger.error(`Error downloading file from R2: ${objectKey}`, error.stack);
      throw new InternalServerErrorException(`Failed to download file from R2: ${error.message}`);
    }
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      this.logger.error(`Error checking file existence in R2: ${objectKey}`, error.stack);
      throw new InternalServerErrorException(`Failed to check existence in R2: ${error.message}`);
    }
  }
}
