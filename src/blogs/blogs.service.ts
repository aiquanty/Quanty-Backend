import {
  Injectable,
  InternalServerErrorException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blogs, BlogsDocument } from './blogs.schema';
import { Model } from 'mongoose';
import {
  createBlogInputDto,
  deleteBlogInputDto,
  editBlogDetailsImageInputDto,
  editBlogDetailsInputDto,
  editBlogTitleImageInputDto,
  getAllBlogsReturnDto,
  getBlogByTitleInputDto,
  getBlogInputDto,
  getBlogReturnDto,
} from './dtos/blogs.dto';
import { S3Service } from 'src/s3/s3.service';
import { successMessageDto } from 'app.dto';
import { DEFAULT_FACTORY_CLASS_METHOD_KEY } from '@nestjs/common/module-utils/constants';
@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blogs.name)
    private readonly blogsModel: Model<BlogsDocument>,
    private readonly s3Service: S3Service,
  ) {}

  guidGenerator() {
    var S4 = function () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (
      S4() +
      S4() +
      '-' +
      S4() +
      '-' +
      S4() +
      '-' +
      S4() +
      '-' +
      S4() +
      S4() +
      S4()
    );
  }
  async createBlog(
    blogBody: createBlogInputDto,
    blogImage: Express.Multer.File,
  ): Promise<successMessageDto> {
    try {
      const fileId = this.guidGenerator();
      const imageFileName = `asset/blogImage/${fileId}-${blogImage.originalname.replaceAll(
        /[+%]/g,
        '',
      )}`;
      const s3ResponseTitleImage = await this.s3Service.uploadFileS3(
        imageFileName,
        blogImage,
      );
      if (!s3ResponseTitleImage.success) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Could not upload title image',
        });
      }

      const blog = new Blogs();
      blog.description = blogBody.description;

      blog.title = blogBody.title;
      blog.image = `${fileId}-${blogImage.originalname.replaceAll(
        /[+%]/g,
        '',
      )}`;

      await this.blogsModel.create(blog);
      return {
        success: true,
        message: 'Successfully created blog',
      };
    } catch (err) {
      throw err;
    }
  }

  async editBlogDetails(
    editBlogBody: editBlogDetailsInputDto,
  ): Promise<successMessageDto> {
    try {
      const blog = await this.blogsModel.findById(editBlogBody._id);
      if (!blog) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Blog not found',
        });
      }
      blog.title = editBlogBody.title;
      blog.description = editBlogBody.description;
      await blog.save();
      return {
        success: true,
        message: 'Updated blog details successfully',
      };
    } catch (err) {
      throw err;
    }
  }

  async editBlogImage(
    blogImage: Express.Multer.File,
    editBlogBody: editBlogTitleImageInputDto,
  ): Promise<successMessageDto> {
    try {
      const blog = await this.blogsModel.findById(editBlogBody._id);
      if (!blog) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Blog not found',
        });
      }
      const fileId = this.guidGenerator();
      const imageFileName = `asset/blogImage/${fileId}-${blogImage.originalname.replaceAll(
        /[+%]/g,
        '',
      )}`;
      const s3ResponseTitleImage = await this.s3Service.uploadFileS3(
        imageFileName,
        blogImage,
      );
      if (!s3ResponseTitleImage.success) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Could not upload title image',
        });
      }
      blog.image = `${fileId}-${blogImage.originalname.replaceAll(
        /[+%]/g,
        '',
      )}`;
      await blog.save();
      return {
        success: true,
        message: 'Updated blog title image successfully',
      };
    } catch (err) {
      throw err;
    }
  }

  async deleteBlog(
    deleteBlogBody: deleteBlogInputDto,
  ): Promise<successMessageDto> {
    try {
      const blog = await this.blogsModel.findById(deleteBlogBody._id);
      if (!blog) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Blog not found',
        });
      }
      const resDel = await this.s3Service.deleteFileS3(
        `/asset/blogImage/${blog.image}`,
      );
      if (!resDel.success) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
      await this.blogsModel.deleteOne({
        _id: deleteBlogBody._id,
      });

      return {
        success: true,
        message: 'Successfully deleted blog',
      };
    } catch (err) {
      throw err;
    }
  }

  async getAllBlogs(): Promise<getAllBlogsReturnDto> {
    try {
      const blogs = await this.blogsModel.find({});
      return {
        success: true,
        blogs: blogs,
      };
    } catch (err) {
      return {
        success: false,
        blogs: [],
      };
    }
  }
  async getBlog(getBlog: getBlogInputDto): Promise<getBlogReturnDto> {
    try {
      const blog = await this.blogsModel.findOne({
        _id: getBlog._id,
      });
      return {
        success: true,
        blog: blog,
      };
    } catch (err) {
      return {
        success: false,
        blog: null,
      };
    }
  }
  async getBlogByTitle(
    getBlog: getBlogByTitleInputDto,
  ): Promise<getBlogReturnDto> {
    try {
      const blog = await this.blogsModel.findOne({
        title: getBlog.title,
      });
      return {
        success: true,
        blog: blog,
      };
    } catch (err) {
      return {
        success: false,
        blog: null,
      };
    }
  }
}
