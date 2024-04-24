import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as request from 'request';
import { Response } from 'express';
import {
  getBlogImageInputDto,
  getFileDto,
  successMessageDto,
} from './dtos/s3.dto';
import { JwtPayloadDto } from 'src/auth/dtos/auth-jwt.dto';

@Injectable()
export class S3Service {
  private bucketName: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private domainAWS: string;
  private s3: S3Client;
  constructor() {
    this.bucketName = process.env.AWS_BUCKET_NAME;
    this.region = process.env.AWS_BUCKET_REGION;
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.domainAWS = process.env.AWS_CLOUDFRONTDOMAIN;

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  async uploadFileS3(
    filename: string,
    file: Express.Multer.File,
  ): Promise<successMessageDto> {
    try {
      const input: PutObjectCommandInput = {
        Body: file.buffer,
        Bucket: this.bucketName,
        Key: filename,
        ContentType: file.mimetype,
      };

      const res: PutObjectCommandOutput = await this.s3.send(
        new PutObjectCommand(input),
      );
      if (res.$metadata.httpStatusCode === 200) {
        return { success: true, message: 'File uploaded to s3' };
      } else {
        throw new InternalServerErrorException({
          success: false,
          message: 'Failed to upload to s3',
        });
      }
    } catch (err) {
      console.log('Error in uploading file to s3', err);
      throw err;
    }
  }

  async getFileS3(
    userDetails: JwtPayloadDto,
    fileDetails: getFileDto,
    res: Response,
  ): Promise<any> {
    try {
      var urlCdn = `${this.domainAWS}/asset/${userDetails.email}/${fileDetails.collectionName}/${fileDetails.fileIndex}-${fileDetails.filename}`;
      request(urlCdn).pipe(res);
    } catch (err) {
      console.log('Error in getting file from s3 without folder', err);
      res.status(400).send(err.message);
    }
  }

  async getBlogImage(res: Response, image: string): Promise<any> {
    try {
      var urlCdn = `${this.domainAWS}/asset/blogImage/${image}`;
      request(urlCdn).pipe(res);
    } catch (err) {
      console.log('Error in getting file from s3 without folder', err);
      res.status(400).send(err.message);
    }
  }

  async getUserProfileImage(
    res: Response,
    image: string,
    email: string,
  ): Promise<any> {
    try {
      var urlCdn = `${this.domainAWS}/asset/${email}/profilePicture/${image}`;
      console.log(urlCdn);
      request(urlCdn).pipe(res);
    } catch (err) {
      console.log('Error in getting file from s3 without folder', err);
      res.status(400).send(err.message);
    }
  }
  async deleteFileS3(filename: string): Promise<successMessageDto> {
    try {
      const res: DeleteObjectCommandOutput = await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
        }),
      );

      if (res.$metadata.httpStatusCode === 204) {
        return { success: true, message: 'Successfully deleted object' };
      } else {
        throw new InternalServerErrorException('Failed to delete file from S3');
      }
    } catch (err) {
      console.log('Error in deleting file from S3', err);
      throw err;
    }
  }
}
