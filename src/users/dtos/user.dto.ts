import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsNumber,
} from 'class-validator';
import { User, UserDocument } from '../users.schema';

export class createUserDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  businessName: string;
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  email: string;
}

export class LoginUserDto {
  token: string;
  email: string;
  productId: string;
  role: string;
}

export class googleLoginUserJwtDto {
  type: string;
  googleId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class LoginGoogleUserDto {
  token: string;
  email: string;
  status: string;
}

export class userAlreadyExistsReturnDto {
  token: string | null;
  userAlreadyExists: boolean;
}

export class createAiProjectForFileInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  collectionName: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  dataAnomiyzer: string;
  @IsString()
  @IsNotEmpty()
  sourceChatGpt: string;
  @IsString()
  @IsNotEmpty()
  bestGuess: string;
}

export class createAiProjectForURLInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  collectionName: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsBoolean()
  @IsNotEmpty()
  dataAnomiyzer: boolean;
  @IsBoolean()
  @IsNotEmpty()
  sourceChatGpt: boolean;
  @IsNumber()
  @IsNotEmpty()
  bestGuess: number;

  @IsArray()
  @IsNotEmpty()
  urls: string[];
}

export class CreateUserIndexInputDto {
  @IsString()
  @IsNotEmpty()
  indexName: string;
}

export class createCollectionInputDto {
  @IsString()
  @IsNotEmpty()
  collectionName: string;
}

export class getCollectionsForUserReturnDto {
  success: boolean;
  collections: string[];
}

export class askQueryFromAiInputDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  collectionName: string;
}

export class askQueryFromAiOutputDto {
  success: boolean;
  answer: string;
}

export class getLoggedInUserReturnDto {
  success: boolean;
  user: {
    name: string;
    role: string;
    email: string;
    businessName: string;
    phone: string;
    profileImage: string;
  };
  collections: {
    name: string;
    writeAccess: boolean;
    projects: {
      id: number;
      type: string;
      description: string;
      model: string;
      language: string;
      dataAnomiyzer: boolean;
      sourceChatGpt: boolean;
      bestGuess: number;
      urls: string[];
      file: string;
    }[];
  }[];
  accountDetails: {
    allowedCredits: number;
    usedCredits: number;
    allowedTeamMembers: number;
    allowedAssistants: number;
    usedAssistants: number;
    teamMembers: string[];
  };
  productId: string;
}

export class setUserAccessToCollectionsInputDto {
  @IsBoolean()
  @IsNotEmpty()
  readAccess: boolean;
  @IsBoolean()
  @IsNotEmpty()
  writeAccess: boolean;
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsString()
  @IsNotEmpty()
  collectionName: string;

  @IsString()
  @IsNotEmpty()
  action: string;
}

export class editCollectionNameInputDto {
  @IsString()
  @IsNotEmpty()
  newCollectionName: string;

  @IsString()
  @IsNotEmpty()
  oldCollectionName: string;
}

export class deleteCollectionInputDto {
  @IsString()
  @IsNotEmpty()
  collectionName: string;
}

export class getAllUsersWithOwnerRoleOutputDto {
  success: boolean;
  users: {
    _id: string;
    email: string;
    name: string;
    businessName: string;
    phone: string;
    accountDetails: {
      allowedCredits: number;
      usedCredits: number;
      allowedTeamMembers: number;
      allowedAssistants: number;
      teamMembers: number;
    }[];
    collections: number;
  }[];
}

export class getUserAndTeamMemberDetailsByOwnerEmailInputDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class getAllNonSubscribedUsersReturnDto {
  success: boolean;
  users: {
    _id: string;
    email: string;
    name: string;
    businessName: string;
    phone: string;
  }[];
}

export class getUserAndTeamMemberDetailsByOwnerEmailReturnDto {
  success: boolean;
  user: {
    _id: string;
    email: string;
    name: string;
    businessName: string;
    phone: string;
    accountDetails: {
      allowedCredits: number;
      usedCredits: number;
      allowedTeamMembers: number;
      allowedAssistants: number;
      teamMembers: {
        _id: string;
        email: string;
        name: string;
        businessName: string;
        phone: string;
      }[];
    };
    collections: number;
  };
}

export class setUserProfileSettingsInputDto {
  name: string;

  businessName: string;
  phone: string;
  oldPassword: string;
  newPassword: string;
}
