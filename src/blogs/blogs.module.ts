import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Blogs, BlogsSchema } from './blogs.schema';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [
    S3Module,
    MongooseModule.forFeature([{ name: Blogs.name, schema: BlogsSchema }]),
  ],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}
