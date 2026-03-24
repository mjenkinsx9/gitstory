import { describe, it, expect } from 'vitest';
import { getStyles } from '../../report/styles.js';

describe('getStyles', () => {
  it('returns a string', () => {
    const css = getStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains all required section selectors', () => {
    const css = getStyles();
    const sections = ['#hero', '#prologue', '#pulse', '#story', '#cast', '#rhythm', '#epilogue'];
    for (const selector of sections) {
      expect(css).toContain(selector);
    }
  });

  it('contains .noise-overlay class', () => {
    const css = getStyles();
    expect(css).toContain('.noise-overlay');
  });

  it('contains .fade-in class', () => {
    const css = getStyles();
    expect(css).toContain('.fade-in');
  });

  it('contains @media queries', () => {
    const css = getStyles();
    expect(css).toContain('@media');
  });

  it('contains background color #06060e', () => {
    const css = getStyles();
    expect(css).toContain('#06060e');
  });

  it('contains font-family references to Inter and JetBrains Mono', () => {
    const css = getStyles();
    expect(css).toContain('Inter');
    expect(css).toContain('JetBrains Mono');
  });
});
