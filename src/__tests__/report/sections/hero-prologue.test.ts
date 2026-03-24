import { describe, it, expect } from 'vitest';
import { generateHero } from '../../../report/sections/hero.js';
import { generatePrologue } from '../../../report/sections/prologue.js';
import type { StoryData } from '../../../types.js';

function makeStoryData(overrides: Partial<StoryData> = {}): StoryData {
  return {
    repoName: 'my-repo',
    title: 'My Repo',
    totalCommits: 142,
    totalContributors: 7,
    totalAdditions: 9500,
    totalDeletions: 3200,
    firstCommitDate: new Date('2023-01-15'),
    lastCommitDate: new Date('2024-06-20'),
    chapters: [],
    contributors: [],
    dailyActivity: [],
    commits: [],
    ...overrides,
  };
}

describe('generateHero', () => {
  it('returns a string containing id="hero"', () => {
    const html = generateHero(makeStoryData());
    expect(html).toContain('id="hero"');
  });

  it('contains the repo name', () => {
    const html = generateHero(makeStoryData({ repoName: 'awesome-lib' }));
    expect(html).toContain('awesome-lib');
  });

  it('contains stat values', () => {
    const html = generateHero(makeStoryData({ totalCommits: 142, totalContributors: 7 }));
    expect(html).toContain('142');
    expect(html).toContain('7');
  });

  it('contains gradient-text class', () => {
    const html = generateHero(makeStoryData());
    expect(html).toContain('gradient-text');
  });

  it('contains orb animation divs', () => {
    const html = generateHero(makeStoryData());
    const orbCount = (html.match(/class="orb/g) || []).length;
    expect(orbCount).toBeGreaterThanOrEqual(3);
  });

  it('escapes HTML in repo name', () => {
    const html = generateHero(makeStoryData({ repoName: '<script>alert("xss")</script>' }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('generatePrologue', () => {
  it('returns a string containing id="prologue"', () => {
    const html = generatePrologue(makeStoryData());
    expect(html).toContain('id="prologue"');
  });

  it('contains fade-in class', () => {
    const html = generatePrologue(makeStoryData());
    expect(html).toContain('fade-in');
  });

  it('contains counter elements with data-target attributes', () => {
    const data = makeStoryData({
      totalCommits: 142,
      totalContributors: 7,
      totalAdditions: 9500,
      totalDeletions: 3200,
    });
    const html = generatePrologue(data);
    expect(html).toContain('data-target="142"');
    expect(html).toContain('data-target="7"');
    expect(html).toContain('data-target="9500"');
    expect(html).toContain('data-target="3200"');
  });

  it('contains counter class on counter elements', () => {
    const html = generatePrologue(makeStoryData());
    const counterCount = (html.match(/class="counter/g) || []).length;
    expect(counterCount).toBeGreaterThanOrEqual(4);
  });

  it('contains labels for each counter', () => {
    const html = generatePrologue(makeStoryData());
    const lower = html.toLowerCase();
    expect(lower).toContain('commit');
    expect(lower).toContain('contributor');
    expect(lower).toContain('added');
    expect(lower).toContain('deleted');
  });
});
