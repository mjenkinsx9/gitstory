import { describe, it, expect } from 'vitest';
import { generateRhythm } from '../../../report/sections/rhythm.js';
import { getRhythmScript } from '../../../report/sections/rhythm.js';

describe('generateRhythm', () => {
  it('returns HTML with id="rhythm"', () => {
    const html = generateRhythm();
    expect(html).toContain('id="rhythm"');
  });

  it('contains an SVG container div with id="rhythm-chart"', () => {
    const html = generateRhythm();
    expect(html).toContain('id="rhythm-chart"');
  });

  it('contains the section title "The Rhythm"', () => {
    const html = generateRhythm();
    expect(html).toContain('The Rhythm');
  });

  it('contains a description paragraph', () => {
    const html = generateRhythm();
    expect(html).toContain('<p');
  });
});

describe('getRhythmScript', () => {
  const script = getRhythmScript();

  it('returns JS containing d3.scaleBand', () => {
    expect(script).toContain('d3.scaleBand');
  });

  it('returns JS containing a color scale', () => {
    expect(script).toContain('d3.scaleSequential');
  });

  it('returns JS containing tooltip logic', () => {
    expect(script).toContain('tooltip');
  });

  it('returns JS containing mouseover handler', () => {
    expect(script).toContain('mouseover');
  });

  it('returns JS containing week/day grid logic', () => {
    expect(script).toContain('d3.utcSunday');
    expect(script).toContain('getUTCDay');
  });

  it('references STORY_DATA.dailyActivity', () => {
    expect(script).toContain('STORY_DATA.dailyActivity');
  });

  it('contains the heatmap color endpoints', () => {
    expect(script).toContain('#0a0a1a');
    expect(script).toContain('#00ffcc');
  });

  it('contains cell size definition', () => {
    expect(script).toContain('14');
  });

  it('contains day-of-week labels', () => {
    expect(script).toContain('Mon');
    expect(script).toContain('Wed');
    expect(script).toContain('Fri');
  });
});
