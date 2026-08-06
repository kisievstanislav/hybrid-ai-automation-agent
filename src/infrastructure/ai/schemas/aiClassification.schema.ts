import { z } from 'zod';

export const aiTicketCategorySchema = z.enum([
  'AUTHENTICATION',
  'BILLING',
  'TECHNICAL',
  'ACCOUNT',
  'SECURITY',
  'OTHER',
]);

export const aiTicketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const aiSupportTeamSchema = z.enum([
  'IDENTITY_SUPPORT',
  'BILLING_SUPPORT',
  'TECHNICAL_SUPPORT',
  'ACCOUNT_SUPPORT',
  'SECURITY_OPERATIONS',
  'GENERAL_SUPPORT',
]);

export const aiClassificationSchema = z.object({
  category: aiTicketCategorySchema,
  priority: aiTicketPrioritySchema,
  recommendedTeam: aiSupportTeamSchema,
  recommendedAction: z.string().trim().min(1),
  confidence: z.number().min(0).max(1),
  reasoningSummary: z.string().trim().min(1),
  riskIndicators: z.array(z.string().trim().min(1)),
});

export type ValidatedAiClassification = z.infer<typeof aiClassificationSchema>;
