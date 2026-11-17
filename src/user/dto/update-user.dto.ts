import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'New Name', required: false })
  name?: string;

  @ApiProperty({ example: 'new@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  password?: string;
}