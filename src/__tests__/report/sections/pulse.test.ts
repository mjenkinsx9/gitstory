import { describe, it, expect } from 'vitest';
import { generatePulse, getPulseScript } from '../../../report/sections/pulse.js';

describe('generatePulse', () => {
  it('returns an HTML string with id="pulse"', () => {
    const html = generatePulse();
    expect(html).toContain('id="pulse"');
  });

  it('contains an SVG container div with id="pulse-chart"', () => {
    const html = generatePulse();
    expect(html).toContain('id="pulse-chart"');
  });

  it('contains the section title "The Pulse"', () => {
    const html = generatePulse();
    expect(html).toContain('The Pulse');
  });
});

describe('getPulseScript', () => {
  it('returns a JavaScript string', () => {
    const js = getPulseScript();
    expect(typeof js).toBe('string');
    expect(js.length).toBeGreaterThan(0);
  });

  it('uses d3.area for area chart generation', () => {
    const js = getPulseScript();
    expect(js).toContain('d3.area');
  });

  it('uses curveMonotoneX for smooth curves', () => {
    const js = getPulseScript();
    expect(js).toContain('curveMonotoneX');
  });

  it('defines a gradient for the area fills', () => {
    const js = getPulseScript();
    expect(js).toContain('gradient');
  });

  it('includes tooltip functionality', () => {
    const js = getPulseScript();
    expect(js).toContain('tooltip');
  });

  it('includes mouseover event handling', () => {
    const js = getPulseScript();
    expect(js).toContain('mouseover');
  });

  it('defines a glow filter using feGaussianBlur and feMerge', () => {
    const js = getPulseScript();
    expect(js).toContain('glow');
    expect(js).toContain('feGaussianBlur');
    expect(js).toContain('feMerge');
  });

  it('reads from STORY_DATA.dailyActivity', () => {
    const js = getPulseScript();
    expect(js).toContain('STORY_DATA.dailyActivity');
  });
});
