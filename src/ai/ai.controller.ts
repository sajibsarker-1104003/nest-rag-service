import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(@Inject(AiService) private readonly ai: AiService) {}

  @Post('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ingest a document (embed + store)' })
  @ApiBody({ schema: { properties: { content: { type: 'string' } } } })
  ingest(@Body() dto: { content: string }) {
    return this.ai.ingest(dto.content);
  }

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ask a question using stored documents' })
  @ApiBody({ schema: { properties: { question: { type: 'string' } } } })
  ask(@Body() dto: { question: string }) {
    return this.ai.ask(dto.question);
  }
}