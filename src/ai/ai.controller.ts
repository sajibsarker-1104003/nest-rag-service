import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AiService } from './ai.service.js';
import { AskDto, IngestDto } from './dto/ai.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(@Inject(AiService) private readonly ai: AiService) {}

  @Post('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ingest a document (embed + store)' })
  ingest(@Body() dto: IngestDto) {
    return this.ai.ingest(dto.content);
  }

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ask a question using stored documents' })
  ask(@Body() dto: AskDto) {
    return this.ai.ask(dto.question);
  }

  @Post('ask/stream')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ask a question, answer streamed over SSE' })
  async askStream(@Body() dto: AskDto, @Res() res: Response) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    // Client disconnect hole upstream LLM request cancel hobe.
    const ac = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) ac.abort();
    });

    try {
      for await (const ev of this.ai.askStream(dto.question, ac.signal)) {
        res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev.data)}\n\n`);
      }
    } catch {
      if (!ac.signal.aborted) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ message: 'stream failed' })}\n\n`,
        );
      }
    } finally {
      res.end();
    }
  }
}