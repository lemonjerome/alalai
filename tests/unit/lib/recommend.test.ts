import {
  recommendRequestSchema,
  ollamaResponseSchema,
} from '@/lib/validations/recommend';

describe('recommendRequestSchema', () => {
  it('accepts a valid symptom description', () => {
    const result = recommendRequestSchema.safeParse({
      symptoms: 'I have had a persistent cough for three days.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects symptoms shorter than 10 chars', () => {
    const result = recommendRequestSchema.safeParse({ symptoms: 'cough' });
    expect(result.success).toBe(false);
  });

  it('rejects symptoms longer than 1000 chars', () => {
    const result = recommendRequestSchema.safeParse({ symptoms: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
  });

  it('trims whitespace', () => {
    const result = recommendRequestSchema.safeParse({
      symptoms: '   I have a headache and fever.   ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.symptoms).toBe('I have a headache and fever.');
    }
  });
});

describe('ollamaResponseSchema', () => {
  it('accepts a response with a single specialization', () => {
    const result = ollamaResponseSchema.safeParse({
      specializations: ['General Practice'],
      reasoning: 'A general practitioner can evaluate your symptoms.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a response with multiple specializations', () => {
    const result = ollamaResponseSchema.safeParse({
      specializations: ['Cardiology', 'General Practice'],
      reasoning: 'Your symptoms may relate to both heart and general health issues.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specializations).toHaveLength(2);
    }
  });

  it('rejects an empty specializations array', () => {
    const result = ollamaResponseSchema.safeParse({
      specializations: [],
      reasoning: 'Some reasoning.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing reasoning', () => {
    const result = ollamaResponseSchema.safeParse({
      specializations: ['Cardiology'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing specializations', () => {
    const result = ollamaResponseSchema.safeParse({
      reasoning: 'You should see a doctor.',
    });
    expect(result.success).toBe(false);
  });
});
