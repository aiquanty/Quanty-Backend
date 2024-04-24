import { IsNotEmpty, IsString } from 'class-validator';

export class emailInvitationLinkForTeamMemberInputDto {
  @IsNotEmpty()
  @IsString()
  email: string;
}

export class getInvitedUserReturnDto {
  success: boolean;
  email: string;
  exists: boolean;
}
