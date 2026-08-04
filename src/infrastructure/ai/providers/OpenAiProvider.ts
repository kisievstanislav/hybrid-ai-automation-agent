import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import type {
  AiClassificationResult,
  AiProvider,
} from '../../../application/ports/ai/AiProvider.js';
import { AiProviderError } from '../../../core/errors/AiProviderError.js';
import { AiResponseValidationError } from '../../../core/errors/AiResponseValidationError.js';
import type { Ticket } from '../../../domain/ticket/Ticket.js';
import { aiClassificationSchema } from '../schemas/aiClassification.schema.js';

export class OpenAiProvider implements AiProvider {
  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async classifyTicket(ticket: Ticket): Promise<AiClassificationResult> {
    try {
      const response = await this.client.responses.parse({
        model: this.model,

        instructions: [
          'Classify the support ticket.',
          'Only recommend values allowed by the provided schema.',
          'Do not perform any action.',
          'Return a short reasoning summary.',
        ].join(' '),

        input: JSON.stringify({
          title: ticket.title,
          description: ticket.description,
          customerType: ticket.customerType,
          tags: ticket.tags,
          previousAttempts: ticket.previousAttempts,
        }),

        text: {
          format: zodTextFormat(aiClassificationSchema, 'ticket_classification'),
        },
      });

      const classification = response.output_parsed;

      if (!classification) {
        throw new AiResponseValidationError('OpenAI returned no valid ticket classification.');
      }

      const validationResult = aiClassificationSchema.safeParse(classification);

      if (!validationResult.success) {
        throw new AiResponseValidationError('OpenAI returned an invalid ticket classification.', {
          cause: validationResult.error,
        });
      }

      return validationResult.data;
    } catch (error) {
      if (error instanceof AiResponseValidationError) {
        throw error;
      }

      throw new AiProviderError('OpenAI ticket classification failed.', {
        cause: error,
        retryable: true,
      });
    }
  }
}
