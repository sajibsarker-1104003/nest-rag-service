import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private embeddingClient: OpenAI;
  private chatClient: OpenAI;

  constructor(
    @Inject(ConfigService) private config: ConfigService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {
    // Local Dzen embedder container (no API key needed)
    this.embeddingClient = new OpenAI({
      apiKey: 'not-needed',
      baseURL: this.config.get('EMBEDDING_BASE_URL') ?? 'http://localhost:8091/v1',
    });

    // Free chat provider (Groq), OpenAI-compatible
    this.chatClient = new OpenAI({
      apiKey: this.config.getOrThrow('CHAT_API_KEY'),
      baseURL: this.config.get('CHAT_BASE_URL') ?? 'https://api.groq.com/openai/v1',
    });
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
    const queryVector = await this.embed(question);

    // pgvector similarity search: cosineDistance -> <=>, asc = closest first
    const plan = this.prisma.docs.sql.public.Document
      .select('id', 'content')
      .select('distance', (f, fns) => fns.cosineDistance(f.embedding, queryVector))
      .orderBy((f, fns) => fns.cosineDistance(f.embedding, queryVector), {
        direction: 'asc',
      })
      .limit(5)
      .build();

    const matches = await this.prisma.docs.runtime().query(plan);

    if (!matches.length) {
      return { answer: 'No relevant documents found.', sources: [] };
    }

    const context = matches.map((m: any) => m.content).join('\n\n');

    const completion = await this.chatClient.chat.completions.create({
      model: this.config.get('CHAT_MODEL') ?? 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Answer the question using only the provided context. If the answer is not in the context, say you do not know.',
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    return {
      answer: completion.choices[0]?.message?.content ?? '',
      sources: matches.map((m: any) => ({ id: m.id, distance: m.distance })),
    };
  }
}