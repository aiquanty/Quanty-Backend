import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
  HttpCode,
  RawBodyRequest,
  Headers,
  UploadedFiles,
  Delete,
  Query,
} from '@nestjs/common';
import {
  CreateUserIndexInputDto,
  createUserDto,
  createAiProjectForFileInputDto,
  createAiProjectForURLInputDto,
  createCollectionInputDto,
  askQueryFromAiInputDto,
  setUserAccessToCollectionsInputDto,
  editCollectionNameInputDto,
  deleteCollectionInputDto,
  getUserAndTeamMemberDetailsByOwnerEmailInputDto,
  setUserProfileSettingsInputDto,
} from './users/dtos/user.dto';
import { UsersService } from './users/users.service';
import {
  AdminsAuthGuard,
  UsersAuthGuard,
} from './auth/gaurds/local-auth.guard';
import {
  JwtAddUserToProjectAuthGuard,
  JwtAdminAuthGuard,
  JwtAuthGuard,
  JwtForgotPassowrdAuthGuard,
} from './auth/gaurds/jwt-auth.guard';
import { GoogleOauthGuard } from './auth/gaurds/google-oauth.gaurd';
import { PdfService } from './pdf/pdf.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3/s3.service';
import { getFileDto } from './s3/dtos/s3.dto';
import { PasswordService } from './password/password.service';
import {
  forgotPasswordInputDto,
  resetPasswordInputDto,
} from './password/dtos/password.dto';

import { PaymentService } from './payment/payment.service';
import {
  PaymentRequestBody,
  changeSubscriptionBodyDto,
  createSubscriptionBodyDto,
  createSubscriptionForAdminBodyDto,
} from './payment/dtos/payment.dto';
import { Response as ResponseType } from 'express';
import { ProductsService } from './products/products.service';
import {
  createProductBodyDto,
  deleteProductBodyDto,
  editProductBodyDto,
} from './products/dtos/products.dto';
import { AdminsService } from './admins/admins.service';
import {
  cancelAnyUserSubscriptionInputDto,
  createAdminDto,
  giveUserFreeProductSubscriptionInputDto,
} from './admins/dtos/admins.dto';
import { AddUserToProjectService } from './add-user-to-project/add-user-to-project.service';
import { emailInvitationLinkForTeamMemberInputDto } from './add-user-to-project/dtos/add-user-to-project.dto';
import { BlogsService } from './blogs/blogs.service';
import {
  createBlogInputDto,
  deleteBlogInputDto,
  editBlogDetailsImageInputDto,
  editBlogDetailsInputDto,
  editBlogTitleImageInputDto,
  getBlogByTitleInputDto,
  getBlogInputDto,
} from './blogs/dtos/blogs.dto';
import { MailService } from './mail/mail.service';
import { sendUserQueryInputDto } from './mail/dtos/mail.dto';
@Controller('/v1')
export class AppController {
  constructor(
    private readonly UsersService: UsersService,
    private readonly PasswordService: PasswordService,
    private readonly S3Service: S3Service,
    private readonly PdfService: PdfService,
    private paymentService: PaymentService,
    private ProductsService: ProductsService,
    private AdminsService: AdminsService,
    private AddUserToProjectService: AddUserToProjectService,
    private BlogsService: BlogsService,
    private MailService: MailService,
  ) {}
  /********************
   Admins Panel
   *******************/
  /********************
   Authorization
   *******************/

  @Post('/admin/auth/signup')
  async createAdmin(@Body() body: createAdminDto) {
    return this.AdminsService.createAdmin(body);
  }

  @UseGuards(AdminsAuthGuard)
  @Post('/admin/auth/signin')
  async loginAdmin(
    @Request() req,
    @Res({
      passthrough: true,
    })
    res: ResponseType,
  ) {
    return this.AdminsService.login(req.user, res);
  }

  /***************************************
             Admins User Api
    ***************************************/
  @UseGuards(JwtAdminAuthGuard)
  @Post('/admin/giveUserFreeProductSubscription')
  giveUserFreeProductSubscription(
    @Request() req,
    @Body() userBody: giveUserFreeProductSubscriptionInputDto,
  ) {
    return this.AdminsService.giveUserFreeProductSubscription(userBody);
  }

  /***************************************
             Users Api
    ***************************************/
  @UseGuards(JwtAdminAuthGuard)
  @Post('/admin/user/cancelAnyUserSubscription')
  cancelAnyUserSubscription(
    @Request() req,
    @Body() userBody: cancelAnyUserSubscriptionInputDto,
  ) {
    return this.AdminsService.cancelAnyUserSubscription(userBody);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('/admin/user/getAllUsersWithOwnerRole')
  getAllUsersWithOwnerRole(@Request() req) {
    return this.UsersService.getAllUsersWithOwnerRole();
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('/admin/user/getUserAndTeamMemberDetailsByOwnerEmail')
  getUserAndTeamMemberDetailsByOwnerEmail(
    @Request() req,
    @Body() userBody: getUserAndTeamMemberDetailsByOwnerEmailInputDto,
  ) {
    return this.UsersService.getUserAndTeamMemberDetailsByOwnerEmail(userBody);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('/admin/user/getAllNonSubscribedUsers')
  getAllNonSubscribedUsers(@Request() req) {
    return this.UsersService.getAllNonSubscribedUsers();
  }

  /***************************************
             Payments Api
    ***************************************/
  @UseGuards(JwtAdminAuthGuard)
  @Post('/admin/payment/createSubscriptionForAdmin')
  createSubscriptionForAdmin(
    @Request() req,
    @Body() subscriptionBody: createSubscriptionForAdminBodyDto,
  ) {
    return this.paymentService.createSubscriptionForAdmin(subscriptionBody);
  }

  /***************************************
             Blogs Api
    ***************************************/
  @UseGuards(JwtAdminAuthGuard)
  @UseInterceptors(FileInterceptor('File'))
  @Post('/admin/blogs/createBlog')
  createBlog(
    @UploadedFile() File: Express.Multer.File,

    @Body() body: createBlogInputDto,
  ) {
    return this.BlogsService.createBlog(body, File);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Post('/admin/blogs/editBlogDetails')
  editBlogDetails(@Body() body: editBlogDetailsInputDto) {
    return this.BlogsService.editBlogDetails(body);
  }

  @UseGuards(JwtAdminAuthGuard)
  @UseInterceptors(FileInterceptor('File'))
  @Post('/admin/blogs/editBlogImage')
  editBlogImage(
    @UploadedFile() File: Express.Multer.File,

    @Body() body: editBlogTitleImageInputDto,
  ) {
    return this.BlogsService.editBlogImage(File, body);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Delete('/admin/blogs/deleteBlog')
  deleteBlog(@Body() body: deleteBlogInputDto) {
    return this.BlogsService.deleteBlog(body);
  }

  /***************************************
             Products Api
    ***************************************/
  @UseGuards(JwtAdminAuthGuard)
  @Post('/admin/products/createProduct')
  createProduct(@Request() req, @Body() productBody: createProductBodyDto) {
    return this.ProductsService.createProduct(productBody);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Post('/admin/products/editProduct')
  editProduct(@Request() req, @Body() productBody: editProductBodyDto) {
    return this.ProductsService.editProduct(productBody);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Post('/admin/products/deleteProduct')
  deleteProduct(@Request() req, @Body() productBody: deleteProductBodyDto) {
    return this.ProductsService.deleteProduct(productBody);
  }

  /********************
   Users Panel
   *******************/
  /********************
   User
   *******************/
  @UseGuards(JwtAuthGuard)
  @Get('/user/getLoggedInUser')
  async getLoggedInUser(@Request() req) {
    return this.UsersService.getLoggedInUser(req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('File'))
  @Post('/user/setUserProfileSettings')
  async getLogsetUserProfileSettingsgedInUser(
    @Request() req,
    @Body() body: setUserProfileSettingsInputDto,
    @UploadedFile() File: Express.Multer.File,
  ) {
    return this.UsersService.setUserProfileSettings(req.user, body, File);
  }

  @Get('/user/getUserProfileImage')
  async getUserProfileImage(@Query() asset, @Res() res: ResponseType) {
    return this.S3Service.getUserProfileImage(res, asset.image, asset.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user/getTeamMemberDetails')
  async getTeamMemberDetails(@Request() req) {
    return this.UsersService.getTeamMemberDetails(req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('/user/getUserAccess')
  async getUserAccess(@Request() req) {
    return this.UsersService.getUserAccess(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/setUserAccessToCollections')
  async setUserAccessToCollections(
    @Request() req,
    @Body()
    body: setUserAccessToCollectionsInputDto,
  ) {
    return this.UsersService.setUserAccessToCollections(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/editCollectionName')
  async editCollectionName(
    @Request() req,
    @Body()
    body: editCollectionNameInputDto,
  ) {
    return this.UsersService.editCollectionName(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/deleteCollection')
  async deleteCollection(
    @Request() req,
    @Body()
    body: deleteCollectionInputDto,
  ) {
    return this.UsersService.deleteCollection(req.user, body);
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('/user/createUserIndex')
  // async createUserIndex(@Request() req, @Body() body: CreateUserIndexInputDto) {
  //   return this.UsersService.createUserIndex(req.user, body);
  // }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('File'))
  @Post('/user/createAiProjectForFile')
  createAiProjectForFile(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: createAiProjectForFileInputDto,
  ) {
    return this.UsersService.createAiProjectForFile(req.user, body, files);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/createAiProjectForURL')
  createAiProjectForURL(
    @Request() req,
    @Body() body: createAiProjectForURLInputDto,
  ) {
    return this.UsersService.createAiProjectForURL(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user/getUserProjects')
  getUserProjects(@Request() req) {
    return this.UsersService.getUserProjects(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/askQueryFromAi')
  askQueryFromAi(@Request() req, @Body() query: askQueryFromAiInputDto) {
    return this.UsersService.askQueryFromAi(req.user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/getCollectionsForUser')
  getCollectionsForUser(@Request() req) {
    return this.UsersService.getCollectionsForUser(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/createCollection')
  createCollection(@Request() req, @Body() body: createCollectionInputDto) {
    return this.UsersService.createCollection(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/emailInvitationLinkForTeamMember')
  emailInvitationLinkForTeamMember(
    @Request() req,
    @Body() body: emailInvitationLinkForTeamMemberInputDto,
  ) {
    return this.AddUserToProjectService.emailInvitationLinkForTeamMember(
      req.user,
      body,
    );
  }

  @UseGuards(JwtAddUserToProjectAuthGuard)
  @Post('/user/getInvitedUser')
  getInvitedUser(@Request() req) {
    return this.AddUserToProjectService.getInvitedUser(req.user);
  }

  @UseGuards(JwtAddUserToProjectAuthGuard)
  @Post('/user/addUserToProject')
  addUserToProject(@Request() req) {
    return this.AddUserToProjectService.addUserToProject(req.user);
  }
  /********************
   Authorization
   *******************/
  @Post('/auth/signup')
  async createUser(@Body() body: createUserDto) {
    return this.UsersService.createUser(body);
  }

  @UseGuards(UsersAuthGuard)
  @Post('/auth/signin')
  async loginUser(
    @Request() req,
    @Res({
      passthrough: true,
    })
    res: ResponseType,
  ) {
    return this.UsersService.login(req.user, res);
  }

  @Post('/auth/forgotPassword')
  async forgotPassword(@Body() body: forgotPasswordInputDto) {
    return this.PasswordService.forgotPassword(body);
  }

  @UseGuards(JwtForgotPassowrdAuthGuard)
  @Post('/auth/resetPassword')
  async resetPassword(@Request() req, @Body() body: resetPasswordInputDto) {
    return this.PasswordService.resetPassword(req.user, body);
  }

  // @UseGuards(GoogleOauthGuard)
  // @Get('/auth/signin/google')
  // async googleAuth(@Request() req) {}

  // @UseGuards(GoogleOauthGuard)
  // @Get('/auth/signin/google/callback')
  // async googleAuthSignInRedirect(@Request() req) {
  //   return this.UsersService.googleLogin(req.user);
  // }

  // @UseGuards(GoogleOauthGuard)
  // @Get('/auth/signup/google/callback')
  // async googleAuthSignUpRedirect(
  //   @Request() req,
  //   @Res({
  //     passthrough: true,
  //   })
  //   res: ResponseType,
  // ) {
  //   return this.UsersService.googleSignup(req.user, res);
  // }

  /********************
   PDF (only experimental)
   *******************/
  // @UseGuards(JwtAuthGuard)
  // @UseInterceptors(FileInterceptor('File'))
  // @Post('/pdf/highlight/line')
  // highLightPdf(@UploadedFile() file: Express.Multer.File, @Body() body) {
  //   return this.PdfService.HighLightLine(
  //     file,
  //     JSON.parse(body.textContent),
  //     body.highLightText,
  //   );
  // }

  // @UseGuards(JwtAuthGuard)
  // @UseInterceptors(FileInterceptor('File'))
  // @Post('/pdf/highlight/paragraph')
  // highLightPdfParagraph(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() body,
  // ) {
  //   return this.PdfService.HighLightParagraph(
  //     file,
  //     JSON.parse(body.textContent),
  //     body.highLightText,
  //   );
  // }

  /***************************************
             Get File Api
    ***************************************/

  @UseGuards(JwtAuthGuard)
  @Post('/getFileS3')
  getFileS3(
    @Request() req,
    @Res() res: ResponseType,
    @Body() body: getFileDto,
  ) {
    return this.S3Service.getFileS3(req.user, body, res);
  }

  /***************************************
             Payment Api
    ***************************************/
  @UseGuards(JwtAuthGuard)
  @Post('/payment/createPayment')
  createPayments(
    @Request() req,
    @Body() paymentRequestBody: PaymentRequestBody,
  ) {
    return this.paymentService.createPayment(req.user, paymentRequestBody);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/payment/createSubscription')
  createSubscription(
    @Request() req,
    @Body() subscriptionBody: createSubscriptionBodyDto,
  ) {
    return this.paymentService.createSubscription(req.user, subscriptionBody);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/payment/changeSubscription')
  changeSubscription(
    @Request() req,
    @Body() subscriptionBody: changeSubscriptionBodyDto,
  ) {
    return this.paymentService.changeSubscription(req.user, subscriptionBody);
  }
  @UseGuards(JwtAuthGuard)
  @Post('/payment/cancelSubscription')
  cancelSubscription(@Request() req) {
    return this.paymentService.cancelSubscription(req.user);
  }

  @Post('/payment/stripeWebhook')
  paymentSuccessedWebhook(
    @Request() req: RawBodyRequest<Request>,
    @Headers() headers,
  ) {
    return this.paymentService.stripeWebhook(req, headers['stripe-signature']);
  }

  /***************************************
             Products Api
    ***************************************/

  @Get('/products/getAllProducts')
  getAllProducts() {
    return this.ProductsService.getAllFilteredProducts('-stripe');
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('/products/getAllCustomProducts')
  getAllFilteredCustomProducts() {
    return this.ProductsService.getAllFilteredCustomProducts('-stripe');
  }

  @UseGuards(JwtAuthGuard)
  @Get('/products/getAllProductsForUser')
  getAllProductsForUser(@Request() req) {
    return this.ProductsService.getAllProductsForUser(req.user);
  }
  /***************************************
             Blogs Api
    ***************************************/
  @Get('/blogs/getAllBlogs')
  getAllBlogs() {
    return this.BlogsService.getAllBlogs();
  }

  @Post('/blogs/getBlog')
  getBlog(@Body() body: getBlogInputDto) {
    return this.BlogsService.getBlog(body);
  }
  @Post('/blogs/getBlogByTitle')
  getBlogByTitle(@Body() body: getBlogByTitleInputDto) {
    return this.BlogsService.getBlogByTitle(body);
  }

  @Get('/blogs/getBlogImage')
  getBlogImage(@Query() asset, @Res() res: ResponseType) {
    return this.S3Service.getBlogImage(res, asset.image);
  }
  /***************************************
             Blogs Api
    ***************************************/
  @Post('/mail/sendUserQuery')
  sendUserQuery(@Body() body: sendUserQueryInputDto) {
    return this.MailService.sendUserQuery(body);
  }
}
