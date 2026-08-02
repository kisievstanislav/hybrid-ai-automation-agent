import { describe, it, expect } from 'vitest';
import { aiClassificationSchema } from '../../../../../src/infrastructure/ai/schemas/aiClassification.schema.js';


describe('aiClassificationSchema', () => {
  const validClassification = {
    category: 'AUTHENTICATION',
    priority: 'HIGH',
    recommendedTeam: 'IDENTITY_SUPPORT',
    recommendedAction: 'Review authentication logs',
    confidence: 0.94,
    reasoningSummary: 'The customer cannot access the account.',
    riskIndicators: [],
  };

  it('should accept a valid AI classification', () => {
    const result = aiClassificationSchema.safeParse(validClassification);

    expect(result.success).toBe(true);
  });

  it('should reject an unsupported category', () => {
    const result = aiClassificationSchema.safeParse({
      ...validClassification,
      category: 'UNKNOWN_CATEGORY',
    });

    expect(result.success).toBe(false);
  });

  it('should reject confidence greater than one', () => {
    const result = aiClassificationSchema.safeParse({
      ...validClassification,
      confidence: 1.5,
    });

    expect(result.success).toBe(false);
  });

  it('should reject confidence below zero', () => {
    const result = aiClassificationSchema.safeParse({
      ...validClassification,
      confidence: -0.1,
    });

    expect(result.success).toBe(false);
  });

  it('should reject an empty recommended team', () => {
    const result = aiClassificationSchema.safeParse({
      ...validClassification,
      recommendedTeam: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('should reject a missing required property', () => {
    const invalidClassification = {
      category: 'AUTHENTICATION',
      priority: 'HIGH',
      recommendedTeam: 'IDENTITY_SUPPORT',
      confidence: 0.94,
      reasoningSummary: 'The customer cannot access the account.',
      riskIndicators: [],
    };

    const result = aiClassificationSchema.safeParse(
      invalidClassification,
    );

    expect(result.success).toBe(false);
  });

  it('should reject empty risk indicators', () => {
    const result = aiClassificationSchema.safeParse({
      ...validClassification,
      riskIndicators: [''],
    });

    expect(result.success).toBe(false);
  });
});