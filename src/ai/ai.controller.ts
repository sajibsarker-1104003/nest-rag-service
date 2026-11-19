import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
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

  @Post('ask/stream')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ask a question, answer streamed over SSE' })
  @ApiBody({ schema: { properties: { question: { type: 'string' } } } })
  async askStream(@Body() dto: { question: string }, @Res() res: Response) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    // Cancel the upstream LLM call if the client disconnects early.
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