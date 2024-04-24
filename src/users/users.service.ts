import {
  Injectable,
  InternalServerErrorException,
  PreconditionFailedException,
  NotFoundException,
  UnauthorizedException,
  NotAcceptableException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './users.schema';
import {
  createAiProjectForFileInputDto,
  LoginGoogleUserDto,
  LoginUserDto,
  createUserDto,
  googleLoginUserJwtDto,
  userAlreadyExistsReturnDto,
  CreateUserIndexInputDto,
  createAiProjectForURLInputDto,
  createCollectionInputDto,
  getCollectionsForUserReturnDto,
  askQueryFromAiInputDto,
  askQueryFromAiOutputDto,
  getLoggedInUserReturnDto,
  setUserAccessToCollectionsInputDto,
  editCollectionNameInputDto,
  deleteCollectionInputDto,
  getAllUsersWithOwnerRoleOutputDto,
  getUserAndTeamMemberDetailsByOwnerEmailInputDto,
  getUserAndTeamMemberDetailsByOwnerEmailReturnDto,
  getAllNonSubscribedUsersReturnDto,
  setUserProfileSettingsInputDto,
} from './dtos/user.dto';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { successMessageDto } from 'app.dto';
import { MailService } from 'src/mail/mail.service';
import { JwtPayloadDto } from 'src/auth/dtos/auth-jwt.dto';
import { S3Service } from 'src/s3/s3.service';

import { Response as ResponseType, query } from 'express';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly MailService: MailService,

    private readonly S3Service: S3Service,
  ) {}
  async setPassword(user: User, password: string): Promise<void> {
    user.salt = crypto.randomBytes(256).toString('hex');
    user.hash = crypto
      .pbkdf2Sync(password, user.salt, 100000, 512, 'sha512')
      .toString('hex');
  }

  async validPassword(user: User, password: string): Promise<boolean> {
    const hash = crypto.pbkdf2Sync(password, user.salt, 100000, 512, 'sha512');
    const storedHash = Buffer.from(user.hash, 'hex');
    return crypto.timingSafeEqual(storedHash, hash);
  }

  async generateJwt(user: UserDocument): Promise<string> {
    try {
      const payload = {
        _id: user._id,
        email: user.email,
      };
      return this.jwtService.sign(payload);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }
  async getAllUsersWithOwnerRole(): Promise<getAllUsersWithOwnerRoleOutputDto> {
    try {
      const users = await this.userModel.find(
        { role: 'owner' },
        '-hash -salt -stripe ',
      );
      const toReturnUsers = [];
      users.forEach((user) => {
        toReturnUsers.push({
          _id: user._id,
          email: user.email,
          name: user.name,
          businessName: user.businessName,
          phone: user.phone,
          accountDetails: {
            ...user.accountDetails,
            teamMembers: user.accountDetails.teamMembers.length,
          },
          collections: user.collections.length,
        });
      });

      return {
        success: true,
        users: toReturnUsers,
      };
    } catch (err) {
      throw err;
    }
  }

  async getUserAndTeamMemberDetailsByOwnerEmail(
    userDetailBody: getUserAndTeamMemberDetailsByOwnerEmailInputDto,
  ): Promise<getUserAndTeamMemberDetailsByOwnerEmailReturnDto> {
    try {
      const user = await this.getUserByEmail(userDetailBody.email);
      if (user.role !== 'owner') {
        throw new PreconditionFailedException({
          success: false,
          message: 'User is not an owner.',
        });
      }
      const teamMembers = await this.userModel.find({
        _id: { $in: user.accountDetails.teamMembers },
      });
      const teamMembersDetails = teamMembers.map((teamMember) => {
        return {
          _id: teamMember._id,
          email: teamMember.email,
          name: teamMember.name,
          businessName: teamMember.businessName,
          phone: teamMember.phone,
        };
      });
      return {
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          businessName: user.businessName,
          phone: user.phone,
          collections: user.collections.length,
          accountDetails: {
            ...user.accountDetails,
            teamMembers: teamMembersDetails,
          },
        },
      };
    } catch (err) {
      throw err;
    }
  }

  async getAllNonSubscribedUsers(): Promise<getAllNonSubscribedUsersReturnDto> {
    try {
      const users = await this.userModel.find(
        { role: 'none' },
        '-hash -salt -stripe ',
      );
      const toReturnUsers = [];
      users.forEach((user) => {
        toReturnUsers.push({
          _id: user._id,
          email: user.email,
          name: user.name,
          businessName: user.businessName,
          phone: user.phone,
        });
      });

      return {
        success: true,
        users: toReturnUsers,
      };
    } catch (err) {
      throw err;
    }
  }

  async login(user: UserDocument, res: ResponseType): Promise<LoginUserDto> {
    try {
      const token = await this.generateJwt(user);
      res.cookie('token', token, {
        expires: new Date(Date.now() + 3600 * 24 * 5),
      });

      return {
        token: token,
        email: user.email,
        productId: user.productId,
        role: user.role,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getUserByEmail(email: string): Promise<UserDocument> {
    try {
      return await this.userModel.findOne({ email: email });
    } catch (err) {
      throw err;
    }
  }

  async getUsersByProductId(productId: string): Promise<UserDocument[]> {
    try {
      return await this.userModel.find({ productId: productId });
    } catch (err) {
      throw err;
    }
  }
  async getUserById(id: string): Promise<UserDocument> {
    try {
      return await this.userModel.findOne({ _id: new Types.ObjectId(id) });
    } catch (err) {
      throw err;
    }
  }

  async getLoggedInUser(email: string): Promise<getLoggedInUserReturnDto> {
    try {
      const user = await this.getUserByEmail(email);
      if (user.role !== 'owner' && user.role !== 'user') {
        return {
          success: true,
          user: {
            name: user.name,
            role: user.role,
            email: user.email,
            businessName: user.businessName,
            phone: user.phone,

            profileImage: user.profileImage,
          },
          accountDetails: null,
          collections: [],
          productId: user.productId,
        };
      }
      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.getUserById(user.ownerId);
      }
      const collectionsToReturn = [];

      owner.collections.forEach((collection) => {
        if (collection.readAccess.includes(user._id.toString())) {
          collectionsToReturn.push({
            name: collection.name,
            projects: collection.projects,
            writeAccess: collection.writeAccess.includes(user._id.toString()),
          });
        }
      });
      return {
        success: true,
        user: {
          name: user.name,
          role: user.role,
          email: user.email,
          businessName: user.businessName,
          phone: user.phone,
          profileImage: user.profileImage,
        },
        accountDetails: {
          ...owner.accountDetails,
          usedAssistants: owner.collections.length,
        },
        collections: collectionsToReturn,
        productId: user.productId,
      };
    } catch (err) {
      throw err;
    }
  }

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
  async setUserProfileSettings(
    userJwtDetails: JwtPayloadDto,
    userSettings: setUserProfileSettingsInputDto,
    profileImage: Express.Multer.File,
  ): Promise<successMessageDto> {
    try {
      const user = await this.getUserByEmail(userJwtDetails.email);
      if (!user) {
        throw new PreconditionFailedException({
          success: false,
          message: 'User not found',
        });
      }

      if (userSettings.newPassword && userSettings.newPassword !== '') {
        if (!userSettings.oldPassword || userSettings.oldPassword === '') {
          throw new PreconditionFailedException({
            success: false,
            message: 'Old password was not provided',
          });
        }
        if (!(await this.validPassword(user, userSettings.oldPassword))) {
          throw new PreconditionFailedException({
            success: false,
            message: 'Incorrect password',
          });
        }
        await this.setPassword(user, userSettings.newPassword);
      }
      if (profileImage) {
        if (!profileImage.mimetype.includes('image')) {
          throw new PreconditionFailedException({
            success: false,
            message: 'Please upload a valid image',
          });
        }
        const generatedId = this.guidGenerator();
        const s3Upload = await this.S3Service.uploadFileS3(
          `asset/${user.email}/profilePicture/${generatedId}`,
          profileImage,
        );
        if (s3Upload.success) {
          user.profileImage = `${generatedId}`;
        } else {
          throw new PreconditionFailedException({
            success: false,
            message: 'Something went wrong uploading profile picture',
          });
        }
      }
      if (!userSettings.businessName) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Business name cannot be empty',
        });
      }
      user.businessName = userSettings.businessName;
      if (!userSettings.phone) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Phone number cannot be empty',
        });
      }
      user.phone = userSettings.phone;
      if (!userSettings.name) {
        throw new PreconditionFailedException({
          success: false,
          message: 'User name cannot be empty',
        });
      }
      user.name = userSettings.name;
      await user.save();
      return {
        success: true,
        message: 'User settings updated successfully',
      };
    } catch (err) {
      throw err;
    }
  }
  async getTeamMemberDetails(userDetails: JwtPayloadDto) {
    try {
      const user = await this.getUserByEmail(userDetails.email);
      if (user.role !== 'owner') {
        throw new PreconditionFailedException({
          success: false,
          message: 'Only owner is allowed to view the team members',
        });
      }
      var teamMembers = [];
      for (const teamMemberId of user.accountDetails.teamMembers) {
        const teamMember = await this.getUserById(teamMemberId);
        teamMembers.push({
          id: teamMember._id.toString(),
          name: teamMember.name,
          email: teamMember.email,
          phone: teamMember.phone,
          role: teamMember.role,
        });
      }
      return {
        successs: true,
        teamMembers: teamMembers,
      };
    } catch (err) {
      throw err;
    }
  }

  async getUserAccess(userDetails: JwtPayloadDto) {
    try {
      const user = await this.getUserByEmail(userDetails.email);

      if (user.role !== 'owner') {
        throw new PreconditionFailedException({
          success: false,
          message: 'Only owner is allowed to view the access details',
        });
      }
      return {
        success: true,
        collections: user.collections,
      };
    } catch (err) {
      throw err;
    }
  }
  async setUserAccessToCollections(
    userDetails: JwtPayloadDto,
    userAccessEditBody: setUserAccessToCollectionsInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.getUserByEmail(userDetails.email);

      if (user.role !== 'owner') {
        throw new PreconditionFailedException({
          success: false,
          message: 'Only owner can set user access',
        });
      }
      user.collections.forEach((collection) => {
        if (collection.name === userAccessEditBody.collectionName) {
          if (userAccessEditBody.action === 'add') {
            if (userAccessEditBody.readAccess) {
              if (collection.readAccess.includes(userAccessEditBody.userId)) {
                throw new PreconditionFailedException({
                  success: false,
                  message: 'Already have access',
                });
              }
              collection.readAccess.push(userAccessEditBody.userId);
            }

            if (userAccessEditBody.writeAccess) {
              if (collection.writeAccess.includes(userAccessEditBody.userId)) {
                throw new PreconditionFailedException({
                  success: false,
                  message: 'Already have access',
                });
              }
              collection.writeAccess.push(userAccessEditBody.userId);
            }
          } else if (userAccessEditBody.action === 'remove') {
            if (userAccessEditBody.readAccess) {
              if (!collection.readAccess.includes(userAccessEditBody.userId)) {
                throw new PreconditionFailedException({
                  success: false,
                  message: 'User access dose not exist',
                });
              }
              // collections.readAccess.(userAccessEditBody.userId);
              const indexToRemove = collection.readAccess.findIndex(
                (item) => item === userAccessEditBody.userId,
              );

              if (indexToRemove !== -1) {
                collection.readAccess.splice(indexToRemove, 1);
              }
            }

            if (userAccessEditBody.writeAccess) {
              if (!collection.writeAccess.includes(userAccessEditBody.userId)) {
                throw new PreconditionFailedException({
                  success: false,
                  message: 'User access dose not exist',
                });
              }
              const indexToRemove = collection.writeAccess.findIndex(
                (item) => item === userAccessEditBody.userId,
              );

              if (indexToRemove !== -1) {
                collection.writeAccess.splice(indexToRemove, 1);
              }
            }
          }
        }
      });

      user.markModified('collections');
      await user.save();
      return {
        success: true,
        message: 'User access updated',
      };
    } catch (err) {
      throw err;
    }
  }

  async editCollectionName(
    userDetails: JwtPayloadDto,
    editCollectionName: editCollectionNameInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.getUserByEmail(userDetails.email);
      if (user.role !== 'owner' && user.role !== 'user') {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'User is not allowed to edit collection',
        });
      }
      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.getUserById(user.ownerId);
      }
      const collection = owner.collections.find(
        (collection) =>
          collection.name === editCollectionName.oldCollectionName,
      );
      if (!collection) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Collection not found',
        });
      }
      if (!collection.writeAccess.includes(user._id.toString())) {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'User is not allowed to edit collection',
        });
      }
      const request = await fetch(
        process.env.AI_BACKEND_URL + '/api/v1/collection/edit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldCollectionName: editCollectionName.oldCollectionName,
            newCollectionName: editCollectionName.newCollectionName,
          }),
        },
      );
      if (request.status !== 200) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
      const aiResponse = await request.json();
      if (!aiResponse.success) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
      owner.collections.forEach((collection) => {
        if (collection.name === editCollectionName.oldCollectionName) {
          collection.name = editCollectionName.newCollectionName;
        }
      });
      owner.markModified('collections');
      await owner.save();
      return {
        success: true,
        message: 'Collection name updated',
      };
    } catch (err) {
      throw err;
    }
  }

  async deleteCollection(
    userDetails: JwtPayloadDto,
    deleteCollection: deleteCollectionInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.getUserByEmail(userDetails.email);
      if (user.role !== 'owner' && user.role !== 'user') {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'User is not allowed to delete collection',
        });
      }
      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.getUserById(user.ownerId);
      }
      const collection = owner.collections.find(
        (collection) => collection.name === deleteCollection.collectionName,
      );
      if (!collection) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Collection not found',
        });
      }
      if (!collection.writeAccess.includes(user._id.toString())) {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'User is not allowed to delete collection',
        });
      }
      for (const project of collection.projects) {
        if (project.file) {
          const resDel = await this.S3Service.deleteFileS3(
            `asset/${owner.email}/${collection.name}/${project.id}-${project.file}`,
          );
          if (!resDel.success) {
            throw new InternalServerErrorException({
              success: false,
              message: 'Something went wrong',
            });
          }
        }
      }

      const request = await fetch(
        process.env.AI_BACKEND_URL + '/api/v1/collection/delete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collectionName: owner.email + deleteCollection.collectionName,
          }),
        },
      );
      if (request.status !== 200) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
      const aiResponse = await request.json();
      if (!aiResponse.success) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }

      owner.collections = owner.collections.filter(
        (collections) => collections.name !== deleteCollection.collectionName,
      );
      owner.markModified('collections');
      await owner.save();
      return {
        success: true,
        message: 'Collection updated',
      };
    } catch (err) {
      throw err;
    }
  }

  async createUser(userBody: createUserDto): Promise<successMessageDto> {
    try {
      const existingUser = await this.getUserByEmail(userBody.email);
      if (existingUser) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Email already exists',
        });
      }
      var user = new User();
      user.email = userBody.email;
      user.name = userBody.name;
      user.businessName = userBody.businessName;
      user.phone = userBody.phone;

      await this.setPassword(user, userBody.password);
      await this.userModel.create(user);
      return {
        success: true,
        message: 'User created successfully',
      };
    } catch (err) {
      throw err;
    }
  }

  async createCollection(
    userDetails: JwtPayloadDto,
    createCollectionBody: createCollectionInputDto,
  ) {
    try {
      const user = await this.userModel.findOne({ email: userDetails.email });

      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.userModel.findOne({ _id: user.ownerId });
      }

      if (owner.collections.length >= owner.accountDetails.allowedAssistants) {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'Assistant limit reached for current subscription',
        });
      }

      const collectionNames = owner.collections.flatMap((collection) => {
        return collection.name.toLowerCase();
      });

      if (
        collectionNames.includes(
          createCollectionBody.collectionName.toLowerCase(),
        )
      ) {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'Collection name already exists',
        });
      }

      owner.collections.push({
        name: createCollectionBody.collectionName,
        readAccess: [owner._id.toString()],
        writeAccess: [owner._id.toString()],
        noOfPages: 0,
        projects: [],
      });
      await owner.save();
      return {
        success: true,
        message: 'Collection successfully created ',
      };
    } catch (err) {
      throw err;
    }
  }

  async getCollectionsForUser(
    userDetails: JwtPayloadDto,
  ): Promise<getCollectionsForUserReturnDto> {
    try {
      const user = await this.getUserByEmail(userDetails.email);
      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.getUserById(user.ownerId);
      }
      const collectionNames = owner.collections.map((collection) => {
        return collection.name;
      });
      return {
        success: true,
        collections: collectionNames,
      };
    } catch (err) {
      throw err;
    }
  }
  async createAiProjectForFile(
    userDetails: JwtPayloadDto,
    createProjectBody: createAiProjectForFileInputDto,
    files: Express.Multer.File[],
  ): Promise<successMessageDto> {
    try {
      if (files.length === 0) {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'Please upload a file',
        });
      }

      const user = await this.getUserByEmail(userDetails.email);

      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.getUserById(user.ownerId);
      }
      const collection = owner.collections.find(
        (collection) => collection.name === createProjectBody.collectionName,
      );
      if (!collection) {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'No collection found',
        });
      }

      files = files.filter((file) => {
        if (
          !file.mimetype.includes('pdf') &&
          !file.mimetype.includes('txt') &&
          !file.mimetype.includes('text') &&
          !file.mimetype.includes('doc')
        ) {
          if (files.length > 1) {
            return false;
          } else {
            throw new PreconditionFailedException({
              success: false,
              message: 'File type not supported',
            });
          }
        }
        return true;
      });

      const uploadFileS3Promises = files.map(async (file) => {
        const filename = `asset/${owner.email}/${collection.name}/${
          collection.projects.length ?? 0
        }-${file.originalname.replaceAll(/[+%]/g, '')}`;
        return await this.S3Service.uploadFileS3(filename, file);
      });
      const uploadFileS3Responses = await Promise.all(uploadFileS3Promises);
      const aiCreateProjectResponses = await Promise.all(
        uploadFileS3Responses.map(async (s3Response, index) => {
          if (s3Response.success) {
            return await fetch(
              process.env.AI_BACKEND_URL + '/api/v1/createAiPorject',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'file',
                  collectionName: owner.email + collection.name,
                  fileLink: `${process.env.AWS_CLOUDFRONTDOMAIN}/asset/${
                    owner.email
                  }/${collection.name}/${
                    collection.projects.length ?? 0
                  }-${files[index].originalname.replaceAll(/[+%]/g, '')}`,
                  description: createProjectBody.description,
                  model: createProjectBody.model,
                  dataAnomiyzer:
                    createProjectBody.dataAnomiyzer === 'true' ? true : false,
                  sourceChatGpt:
                    createProjectBody.sourceChatGpt === 'true' ? true : false,
                  bestGuess: Number(createProjectBody.bestGuess),
                  urls: [],
                  language: createProjectBody.language,
                  noOfPages: collection.noOfPages,
                }),
              },
            );
          }
        }),
      );
      for (const [index, request] of aiCreateProjectResponses.entries()) {
        if (files.length === 1) {
          if (request.status !== 200 && request.status !== 412) {
            throw new InternalServerErrorException({
              success: false,
              message: 'Something went wrong',
            });
          }
        }

        const aiResponse = await request.json();
        if (files.length === 1) {
          if (request.status === 412) {
            throw new PreconditionFailedException({
              success: false,
              message: aiResponse.message,
            });
          }
          if (!aiResponse.success) {
            throw new InternalServerErrorException({
              success: false,
              message: 'Something went wrong',
            });
          }
          if (!aiResponse.noOfPages) {
            throw new InternalServerErrorException({
              success: false,
              message: 'Something went wrong',
            });
          }
        }

        collection.noOfPages += aiResponse.noOfPages;
        collection.projects.push({
          name: createProjectBody.name,
          type: 'file',
          description: createProjectBody.description,
          model: createProjectBody.model,
          dataAnomiyzer:
            createProjectBody.dataAnomiyzer === 'true' ? true : false,
          sourceChatGpt:
            createProjectBody.sourceChatGpt === 'true' ? true : false,
          bestGuess: Number(createProjectBody.bestGuess),
          urls: [],
          language: createProjectBody.language,
          file: files[index].originalname.replaceAll(/[+%]/g, ''),
          id: collection.projects.length ?? 0,
          date: new Date(),
        });
      }

      // if (s3Response.success) {
      //   const request = await fetch(
      //     process.env.AI_BACKEND_URL + '/api/v1/createAiPorject',
      //     {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //       },
      //       body: JSON.stringify({
      //         type: 'file',
      //         collectionName: collection.name,
      //         fileLink: `${process.env.AWS_CLOUDFRONTDOMAIN}/asset/${
      //           owner.email
      //         }/${collection.name}/${
      //           collection.projects.length ?? 0
      //         }-${file.originalname.replaceAll(/[+%]/g, '')}`,
      //         description: createProjectBody.description,
      //         model: createProjectBody.model,
      //         dataAnomiyzer:
      //           createProjectBody.dataAnomiyzer === 'true' ? true : false,
      //         sourceChatGpt:
      //           createProjectBody.sourceChatGpt === 'true' ? true : false,
      //         bestGuess: Number(createProjectBody.bestGuess),
      //         urls: [],
      //         language: createProjectBody.language,
      //         noOfPages: collection.noOfPages,
      //       }),
      //     },
      //   );

      //   if (request.status !== 200 && request.status !== 412) {
      //     throw new InternalServerErrorException({
      //       success: false,
      //       message: 'Something went wrong',
      //     });
      //   }
      //   const aiResponse = await request.json();
      //   if (request.status === 412) {
      //     throw new PreconditionFailedException({
      //       success: false,
      //       message: aiResponse.message,
      //     });
      //   }
      //   if (!aiResponse.success) {
      //     throw new InternalServerErrorException({
      //       success: false,
      //       message: 'Something went wrong',
      //     });
      //   }
      //   if (!aiResponse.noOfPages) {
      //     throw new InternalServerErrorException({
      //       success: false,
      //       message: 'Something went wrong',
      //     });
      //   }

      //   collection.noOfPages += aiResponse.noOfPages;
      //   collection.projects.push({
      //     name: createProjectBody.name,
      //     type: 'file',
      //     description: createProjectBody.description,
      //     model: createProjectBody.model,
      //     dataAnomiyzer:
      //       createProjectBody.dataAnomiyzer === 'true' ? true : false,
      //     sourceChatGpt:
      //       createProjectBody.sourceChatGpt === 'true' ? true : false,
      //     bestGuess: Number(createProjectBody.bestGuess),
      //     urls: [],
      //     language: createProjectBody.language,
      //     file: file.originalname.replaceAll(/[+%]/g, ''),
      //     id: collection.projects.length ?? 0,
      //     date: new Date(),
      //   });
      // }

      owner.markModified('collections');
      await owner.save();

      return {
        success: true,
        message: 'Successfully Created Project',
      };
    } catch (err) {
      throw err;
    }
  }

  async createAiProjectForURL(
    userDetails: JwtPayloadDto,
    createProjectBody: createAiProjectForURLInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.getUserByEmail(userDetails.email);
      //TODO: add checks
      if (createProjectBody.urls.length > 3) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Only 3 urls are allowed',
        });
      }

      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.getUserById(user.ownerId);
      }
      const collection = owner.collections.find(
        (collection) => collection.name === createProjectBody.collectionName,
      );
      if (!collection) {
        throw new PreconditionFailedException({
          success: 'false',
          message: 'No collection found',
        });
      }

      const request = await fetch(
        process.env.AI_BACKEND_URL + '/api/v1/createAiPorject',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...createProjectBody,
            collectionName: owner.email + createProjectBody.collectionName,
            type: 'url',
            noOfPages: collection.noOfPages,
          }),
        },
      );
      if (request.status !== 200 && request.status !== 412) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
      const aiResponse = await request.json();
      if (request.status === 412) {
        throw new PreconditionFailedException({
          success: false,
          message: aiResponse.message,
        });
      }
      if (!aiResponse.success) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }

      collection.noOfPages += aiResponse.noOfPages;
      collection.projects.push({
        name: createProjectBody.name,
        type: 'url',
        description: createProjectBody.description,
        model: createProjectBody.model,
        dataAnomiyzer: createProjectBody.dataAnomiyzer,
        sourceChatGpt: createProjectBody.sourceChatGpt,
        bestGuess: createProjectBody.bestGuess,
        urls: createProjectBody.urls,
        language: createProjectBody.language,
        file: '',
        id: collection.projects.length,
        date: new Date(),
      });

      owner.markModified('collections');
      await owner.save();

      return {
        success: true,
        message: 'Successfully Created Project',
      };
    } catch (err) {
      if (err.message === 'fetch failed') {
        return {
          success: false,
          message: 'Something went wrong, please try again later',
        };
      }
      throw err;
    }
  }

  async getUserByStripeCustomerId(stripeCustomerId: string) {
    try {
      return await this.userModel.findOne({
        'stripe.customerId': stripeCustomerId,
      });
    } catch (err) {
      throw new InternalServerErrorException({
        success: false,
        message: err.message,
      });
    }
  }

  async removeProductIdFromUser(userId: string): Promise<void> {
    try {
      await this.userModel.updateOne(
        { _id: userId },
        { $unset: { productId: 1 } },
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async removeSubscriptionFromUser(userId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (user.role !== 'owner') {
        throw new PreconditionFailedException({
          success: false,
          message: 'Only owner is allowed to cancel a subscription',
        });
      }
      for (const teamMemberId of user.accountDetails.teamMembers) {
        const teamMember = await this.getUserById(teamMemberId);
        teamMember.role = 'none';
        teamMember.ownerId = '';
        await teamMember.save();
      }
      user.role = 'none';
      user.accountDetails = {
        teamMembers: [],
        allowedAssistants: 0,
        allowedCredits: 0,
        allowedTeamMembers: 0,
        usedCredits: 0,
      };
      await user.save();
      await this.userModel.updateOne(
        { _id: userId },
        { $unset: { productId: 1 } },
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getPayingUsersForProductId(productId: string): Promise<UserDocument[]> {
    try {
      return await this.userModel.find({
        productId: productId,
        $or: [
          { freeSubscription: { $exists: false } },
          { freeSubscription: false },
        ],
      });
    } catch (err) {
      throw err;
    }
  }

  async askQueryFromAi(
    userBody: JwtPayloadDto,
    queryBody: askQueryFromAiInputDto,
  ): Promise<askQueryFromAiOutputDto> {
    try {
      const user = await this.getUserByEmail(userBody.email);
      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.getUserById(user.ownerId);
      }
      const collection = owner.collections.find((collection) => {
        return collection.name === queryBody.collectionName;
      });

      if (!collection) {
        throw new PreconditionFailedException({
          success: false,
          message: 'No collection found',
        });
      }
      const project = collection.projects.find((project) => {
        return project.id === queryBody.projectId;
      });
      if (!project) {
        throw new PreconditionFailedException({
          success: false,
          message: 'No project found',
        });
      }
      if (project.model === 'gpt-3.5-turbo-0125') {
        if (
          owner.accountDetails.usedCredits + 1 >
          owner.accountDetails.allowedCredits
        ) {
          throw new PreconditionFailedException({
            success: false,
            message: 'Insufficient credits',
          });
        }
      } else if (project.model === 'gpt-4') {
        if (
          owner.accountDetails.usedCredits + 2.5 >
          owner.accountDetails.allowedCredits
        ) {
          throw new PreconditionFailedException({
            success: false,
            message: 'Insufficient credits',
          });
        }
      } else if (project.model === 'gpt-4-turbo-preview') {
        if (
          owner.accountDetails.usedCredits + 5 >
          owner.accountDetails.allowedCredits
        ) {
          throw new PreconditionFailedException({
            success: false,
            message: 'Insufficient credits',
          });
        }
      }
      const request = await fetch(
        process.env.AI_BACKEND_URL + '/api/v1/answerQuery',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collectionName: owner.email + collection.name,
            type: project.type,
            fileIndex: project.id,
            filename: project.file,
            description: project.description,
            model: project.model,
            dataAnomiyzer: project.dataAnomiyzer,
            sourceChatGpt: project.sourceChatGpt,
            bestGuess: project.bestGuess,
            urls: project.urls,
            language: project.language,
            query: queryBody.query,
          }),
        },
      );
      if (request.status !== 200) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
      const aiResponse = await request.json();
      if (!aiResponse.success) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
      if (project.model === 'gpt-3.5-turbo-0125') {
        owner.accountDetails.usedCredits += 1;
      } else if (project.model === 'gpt-4') {
        owner.accountDetails.usedCredits += 2.5;
      } else if (project.model === 'gpt-4-turbo-preview') {
        owner.accountDetails.usedCredits += 5;
      }
      await owner.save();
      return {
        success: true,
        answer: aiResponse.answer,
      };
    } catch (err) {
      throw err;
    }
  }
  async getUserProjects(userBody: JwtPayloadDto) {
    try {
      const user = await this.getUserByEmail(userBody.email);
      if (!user) {
        throw new PreconditionFailedException({
          success: false,
          message: 'User not found',
        });
      }

      var owner = user;
      if (user.role !== 'owner') {
        owner = await this.getUserById(user.ownerId);
      }
      const collectionsToReturn = [];

      owner.collections.forEach((collection) => {
        if (collection.readAccess.includes(user._id.toString())) {
          collectionsToReturn.push({
            name: collection.name,
            projects: collection.projects,
            writeAccess: collection.writeAccess.includes(user._id.toString()),
          });
        }
      });

      const projects = collectionsToReturn.flatMap((collection) => {
        collection.projects.forEach((project) => {
          project['collectionName'] = collection.name;
        });
        return collection.projects;
      });
      return {
        success: true,
        projects,
      };
    } catch (err) {
      throw err;
    }
  }
}
