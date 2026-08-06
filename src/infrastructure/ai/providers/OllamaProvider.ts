import type {
  AiClassificationResult,
  AiProvider,
} from '../../../application/ports/ai/AiProvider.js';
import { AiProviderError } from '../../../core/errors/AiProviderError.js';
import { AiResponseValidationError } from '../../../core/errors/AiResponseValidationError.js';
import type { Ticket } from '../../../domain/ticket/Ticket.js';
import { aiClassificationSchema } from '../schemas/aiClassification.schema.js';
import { ollamaGenerateResponseSchema } from '../schemas/ollamaGenerateResponse.schema.js';

export class OllamaProvider implements AiProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly timeoutMs: number,
  ) {}

  async classifyTicket(ticket: Ticket): Promise<AiClassificationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: 'json',
          prompt: this.createPrompt(ticket),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AiProviderError(`Ollama returned HTTP status ${response.status}.`, {
          retryable: response.status >= 500,
        });
      }

      const responseBody: unknown = await response.json();

      const ollamaValidation = ollamaGenerateResponseSchema.safeParse(responseBody);

      if (!ollamaValidation.success) {
        throw new AiResponseValidationError('Ollama returned an invalid API response.', {
          cause: ollamaValidation.error,
        });
      }

      let classification: unknown;

      try {
        classification = JSON.parse(ollamaValidation.data.response);
      } catch (error) {
        throw new AiResponseValidationError('Ollama returned invalid JSON classification text.', {
          cause: error,
        });
      }

      const classificationValidation = aiClassificationSchema.safeParse(classification);

      if (!classificationValidation.success) {
        throw new AiResponseValidationError('Ollama returned an invalid ticket classification.', {
          cause: classificationValidation.error,
        });
      }

      return classificationValidation.data;
    } catch (error) {
      if (error instanceof AiResponseValidationError || error instanceof AiProviderError) {
        throw error;
      }

      throw new AiProviderError('Ollama ticket classification failed.', {
        cause: error,
        retryable: true,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private createPrompt(ticket: Ticket): string {
    return [
      'You are a support ticket classification AI.',
      '',
      'Return ONLY one valid JSON object.',
      'Do not include markdown.',
      'Do not include explanations outside the JSON.',
      '',
      'The JSON MUST exactly match this schema:',
      '{',
      '  "category": "AUTHENTICATION | BILLING | TECHNICAL | ACCOUNT | SECURITY | OTHER",',
      '  "priority": "LOW | MEDIUM | HIGH | CRITICAL",',
      '  "recommendedTeam": "IDENTITY_SUPPORT | BILLING_SUPPORT | TECHNICAL_SUPPORT | ACCOUNT_SUPPORT | SECURITY_OPERATIONS | GENERAL_SUPPORT",',
      '  "recommendedAction": "non-empty string",',
      '  "confidence": 0.95,',
      '  "reasoningSummary": "non-empty string",',
      '  "riskIndicators": ["zero or more non-empty strings"]',
      '}',
      '',
      'Rules:',
      '- Use ONLY the category values listed above.',
      '- Use ONLY the priority values listed above.',
      '- Use ONLY the recommendedTeam values listed above.',
      '- Use the exact field names shown above.',
      '- confidence must be a number between 0 and 1.',
      '- riskIndicators must always be an array.',
      '- Do not invent categories, priorities, teams, or field names.',
      '- Do not perform any action. Only recommend.',
      '- Return JSON only.',
      '',
      'Support Ticket:',
      JSON.stringify({
        title: ticket.title,
        description: ticket.description,
        customerType: ticket.customerType,
        tags: ticket.tags,
        previousAttempts: ticket.previousAttempts,
      }),
    ].join('\n');
  }
}
