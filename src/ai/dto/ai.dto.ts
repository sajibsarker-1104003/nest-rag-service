import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class AskDto {
  @ApiProperty({ example: 'How many days do I have to get a refund?' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question!: string;
}

export class IngestDto {
  @ApiProperty({ example: 'Our refund policy: customers can request a full refund within 30 days.' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content!: string;
}