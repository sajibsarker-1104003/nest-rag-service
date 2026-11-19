import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service.js';

export type AskStreamEvent =
  | { type: 'sources'; data: { id: number; distance: number }[] }
  | { type: 'token'; data: string }
  | {
      type: 'done';
      data: {
        model: string;
        promptTokens?: number;
        completionTokens?: number;
        ttftMs?: number;
        latencyMs: number;
      };
    };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private embeddingClient: OpenAI;
  private chatClient: OpenAI;

  constructor(
    @Inject(ConfigService) private config: ConfigService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {
    // Local embedder (no API key needed)
    this.embeddingClient = new OpenAI({
      apiKey: 'not-needed',
      baseURL: this.config.get('EMBEDDING_BASE_URL') ?? 'http://localhost:8091/v1',
    });

    // Chat provider (Groq by default), OpenAI-compatible
    this.chatClient = new OpenAI({
      apiKey: this.config.getOrThrow('CHAT_API_KEY'),
      baseURL: this.config.get('CHAT_BASE_URL') ?? 'https://api.groq.com/openai/v1',
    });
  }

  private get chatModel(): string {
    return this.config.get<string>('CHAT_MODEL') ?? 'llama-3.3-70b-versatile';
  }

  /** Maximum cosine distance for a document to be used as context. */
  private get maxDistance(): number {
    return Number(this.config.get('RAG_MAX_DISTANCE') ?? 0.45);
  }

  /** Embed text with the local model. Must match the 1024-dim contract. */
  private async embed(input: string): Promise<number[]> {
    const res = await this.embeddingClient.embeddings.create({
      model: this.config.get('EMBEDDING_MODEL') ?? 'deepvk/USER-bge-m3',
      input,
      encoding_format: 'float',
    });
    const vector = res.data[0].embedding;

    if (vector.length !== 1024) {
      throw new Error(
        `Embedding dimension mismatch: got ${vector.length}, expected 1024`,
      );
    }
    return vector;
  }

  /** pgvector similarity search, then drop documents farther than maxDistance. */
  private async retrieve(question: string, limit = 5) {
    const queryVector = await this.embed(question);

    // cosineDistance -> <=>, asc = closest first
    const plan = this.prisma.docs.sql.public.Document
      .select('id', 'content')
      .select('distance', (f, fns) => fns.cosineDistance(f.embedding, queryVector))
      .orderBy((f, fns) => fns.cosineDistance(f.embedding, queryVector), {
        direction: 'asc',
      })
      .limit(limit)
      .build();

    const rows = await this.prisma.docs.runtime().query(plan);
    return rows.filter((m: any) => m.distance <= this.maxDistance);
  }

  private buildMessages(matches: any[], question: string) {
    const context = matches.map((m) => m.content).join('\n\n');
    return [
      {
        role: 'system' as const,
        content:
          'Answer the question using only the provided context. If the answer is not in the context, say you do not know.',
      },
      {
        role: 'user' as const,
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ];
  }

  /** Store a document: embed locally, insert into docs DB. */
  async ingest(content: string) {
    const vector = await this.embed(content);

    const inserted = await this.prisma.docs.orm.public.Document.create({
      content,
      embedding: vector,
    });

    this.logger.log(`Ingested document id=${inserted.id}`);
    return { id: inserted.id, content };
  }

  /** Retrieve similar docs and generate an answer with the chat model. */
  async ask(question: string) {
    const matches = await this.retrieve(question);

    if (!matches.length) {
      return { answer: 'No relevant documents found.', sources: [] };
    }

    const completion = await this.chatClient.chat.completions.create({
      model: this.chatModel,
      messages: this.buildMessages(matches, question),
    });

    return {
      answer: completion.choices[0]?.message?.content ?? '',
      sources: matches.map((m: any) => ({ id: m.id, distance: m.distance })),
    };
  }

  /**
   * Streaming version of ask().
   * Yields: sources -> token* -> done (with usage and latency).
   */
  async *askStream(
    question: string,
    signal?: AbortSignal,
  ): AsyncGenerator<AskStreamEvent> {
    const start = performance.now();
    const matches = await this.retrieve(question);

    yield {
      type: 'sources',
      data: matches.map((m: any) => ({ id: m.id, distance: m.distance })),
    };

    if (!matches.length) {
      yield { type: 'token', data: 'No relevant documents found.' };
      yield {
        type: 'done',
        data: { model: this.chatModel, latencyMs: performance.now() - start },
      };
      return;
    }

    const stream = await this.chatClient.chat.completions.create(
      {
        model: this.chatModel,
        messages: this.buildMessages(matches, question),
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal },
    );

    let ttftMs: number | undefined;
    let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        ttftMs ??= performance.now() - start;
        yield { type: 'token', data: delta };
      }
      if (chunk.usage) usage = chunk.usage;
    }

    const done = {
      model: this.chatModel,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      ttftMs,
      latencyMs: performance.now() - start,
    };
    this.logger.log(`ask_stream ${JSON.stringify(done)}`);
    yield { type: 'done', data: done };
  }
}