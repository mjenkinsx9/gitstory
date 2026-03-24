import { describe, it, expect } from 'vitest';
import { generateCast, getCastScript } from '../../../report/sections/cast.js';

describe('generateCast', () => {
  it('returns HTML with id="cast"', () => {
    const html = generateCast();
    expect(html).toContain('id="cast"');
  });

  it('contains an SVG container div with id="cast-chart"', () => {
    const html = generateCast();
    expect(html).toContain('id="cast-chart"');
  });

  it('contains the section title "The Cast"', () => {
    const html = generateCast();
    expect(html).toContain('The Cast');
  });

  it('contains a description', () => {
    const html = generateCast();
    expect(html).toContain('<p');
  });
});

describe('getCastScript', () => {
  it('returns a JavaScript string', () => {
    const js = getCastScript();
    expect(typeof js).toBe('string');
    expect(js.length).toBeGreaterThan(0);
  });

  it('uses d3.scaleBand for Y axis', () => {
    const js = getCastScript();
    expect(js).toContain('d3.scaleBand');
  });

  it('uses d3.scaleTime for X axis', () => {
    const js = getCastScript();
    expect(js).toContain('d3.scaleTime');
  });

  it('contains tooltip functionality', () => {
    const js = getCastScript();
    expect(js).toContain('tooltip');
    expect(js).toContain('mouseover');
  });

  it('references STORY_DATA.contributors', () => {
    const js = getCastScript();
    expect(js).toContain('STORY_DATA.contributors');
  });

  it('references the cast-chart container', () => {
    const js = getCastScript();
    expect(js).toContain('#cast-chart');
  });
});
