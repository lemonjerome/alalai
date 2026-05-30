import {
  recommendRequestSchema,
  ollamaResponseSchema,
  SUPPORTED_SPECIALIZATIONS,
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
  it('accepts a valid Ollama response for each supported specialization', () => {
    for (const spec of SUPPORTED_SPECIALIZATIONS) {
      const result = ollamaResponseSchema.safeParse({
        specialization: spec,
        reasoning: 'This specialist is best suited for your condition.',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an unknown specialization', () => {
    const result = ollamaResponseSchema.safeParse({
      specialization: 'Neurology',
      reasoning: 'You should see a neurologist.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing reasoning', () => {
    const result = ollamaResponseSchema.safeParse({
      specialization: 'Cardiology',
    });
    expect(result.success).toBe(false);
  });
});

describe('SUPPORTED_SPECIALIZATIONS', () => {
  it('contains exactly the 5 triage specializations', () => {
    expect(SUPPORTED_SPECIALIZATIONS).toHaveLength(5);
    expect(SUPPORTED_SPECIALIZATIONS).toContain('General Practitioner');
    expect(SUPPORTED_SPECIALIZATIONS).toContain('Pediatrics');
    expect(SUPPORTED_SPECIALIZATIONS).toContain('Dermatology');
    expect(SUPPORTED_SPECIALIZATIONS).toContain('Mental Health');
    expect(SUPPORTED_SPECIALIZATIONS).toContain('Cardiology');
  });
});
