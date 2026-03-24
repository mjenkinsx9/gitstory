import { describe, it, expect, beforeAll } from 'vitest';
import { generateHTML } from '../../report/generator.js';
import type {
  StoryData,
  GitCommit,
  ContributorSummary,
  Chapter,
  DailyActivity,
} from '../../types.js';

// ---------------------------------------------------------------------------
// Realistic fixture data
// ---------------------------------------------------------------------------

function makeCommit(
  hash: string,
  author: string,
  email: string,
  date: Date,
  subject: string,
  files: { path: string; additions: number; deletions: number }[],
  body = '',
): GitCommit {
  return { hash, author, email, date, subject, body, files };
}

function makeContributor(
  name: string,
  email: string,
  commitCount: number,
  additions: number,
  deletions: number,
  firstCommit: Date,
  lastCommit: Date,
): ContributorSummary {
  return { name, email, commitCount, additions, deletions, firstCommit, lastCommit };
}

function buildFixtureData(): StoryData {
  const contributors: ContributorSummary[] = [
    makeContributor('Sarah Chen', 'sarah@example.com', 48, 6200, 1100, new Date('2024-01-10'), new Date('2024-06-28')),
    makeContributor('Marcus Rivera', 'marcus@example.com', 35, 4800, 900, new Date('2024-01-22'), new Date('2024-06-25')),
    makeContributor('Aiko Tanaka', 'aiko@example.com', 27, 3500, 650, new Date('2024-02-05'), new Date('2024-06-20')),
    makeContributor('Dmitri Volkov', 'dmitri@example.com', 18, 2100, 420, new Date('2024-03-01'), new Date('2024-06-15')),
    makeContributor('Priya Sharma', 'priya@example.com', 12, 1400, 280, new Date('2024-04-10'), new Date('2024-06-10')),
  ];

  // 24 commits across the project lifetime
  const commits: GitCommit[] = [
    makeCommit('a1b2c3d', 'Sarah Chen', 'sarah@example.com', new Date('2024-01-10T09:00:00Z'), 'Initial project scaffolding', [{ path: 'package.json', additions: 45, deletions: 0 }, { path: 'tsconfig.json', additions: 30, deletions: 0 }]),
    makeCommit('b2c3d4e', 'Sarah Chen', 'sarah@example.com', new Date('2024-01-12T14:30:00Z'), 'Add core type definitions', [{ path: 'src/types.ts', additions: 80, deletions: 0 }]),
    makeCommit('c3d4e5f', 'Marcus Rivera', 'marcus@example.com', new Date('2024-01-22T10:15:00Z'), 'Implement git log parser', [{ path: 'src/git/parser.ts', additions: 150, deletions: 0 }]),
    makeCommit('d4e5f6g', 'Sarah Chen', 'sarah@example.com', new Date('2024-01-25T11:00:00Z'), 'Add CLI entry point with Commander', [{ path: 'src/cli.ts', additions: 90, deletions: 5 }]),
    makeCommit('e5f6g7h', 'Marcus Rivera', 'marcus@example.com', new Date('2024-02-01T09:30:00Z'), 'Create diff stats module', [{ path: 'src/git/diff.ts', additions: 120, deletions: 0 }]),
    makeCommit('f6g7h8i', 'Aiko Tanaka', 'aiko@example.com', new Date('2024-02-05T16:00:00Z'), 'Set up test infrastructure', [{ path: 'vitest.config.ts', additions: 25, deletions: 0 }, { path: 'src/__tests__/parser.test.ts', additions: 110, deletions: 0 }]),
    makeCommit('g7h8i9j', 'Sarah Chen', 'sarah@example.com', new Date('2024-02-10T13:45:00Z'), 'Implement chapter detection algorithm', [{ path: 'src/narrative/chapters.ts', additions: 200, deletions: 10 }]),
    makeCommit('h8i9j0k', 'Marcus Rivera', 'marcus@example.com', new Date('2024-02-18T10:00:00Z'), 'Add contributor analysis', [{ path: 'src/utils/contributors.ts', additions: 95, deletions: 0 }]),
    makeCommit('i9j0k1l', 'Aiko Tanaka', 'aiko@example.com', new Date('2024-02-22T15:30:00Z'), 'Build activity heatmap data', [{ path: 'src/utils/activity.ts', additions: 130, deletions: 15 }]),
    makeCommit('j0k1l2m', 'Sarah Chen', 'sarah@example.com', new Date('2024-03-01T08:00:00Z'), 'Create HTML report generator skeleton', [{ path: 'src/report/generator.ts', additions: 180, deletions: 0 }]),
    makeCommit('k1l2m3n', 'Dmitri Volkov', 'dmitri@example.com', new Date('2024-03-05T11:20:00Z'), 'Design hero section with animations', [{ path: 'src/report/sections/hero.ts', additions: 160, deletions: 0 }]),
    makeCommit('l2m3n4o', 'Marcus Rivera', 'marcus@example.com', new Date('2024-03-12T14:00:00Z'), 'Implement prologue section', [{ path: 'src/report/sections/prologue.ts', additions: 140, deletions: 5 }]),
    makeCommit('m3n4o5p', 'Aiko Tanaka', 'aiko@example.com', new Date('2024-03-20T09:45:00Z'), 'Build pulse chart with D3.js', [{ path: 'src/report/sections/pulse.ts', additions: 210, deletions: 0 }]),
    makeCommit('n4o5p6q', 'Dmitri Volkov', 'dmitri@example.com', new Date('2024-03-28T16:30:00Z'), 'Add story timeline section', [{ path: 'src/report/sections/story.ts', additions: 175, deletions: 8 }]),
    makeCommit('o5p6q7r', 'Sarah Chen', 'sarah@example.com', new Date('2024-04-02T10:00:00Z'), 'Create cast visualization', [{ path: 'src/report/sections/cast.ts', additions: 190, deletions: 0 }]),
    makeCommit('p6q7r8s', 'Priya Sharma', 'priya@example.com', new Date('2024-04-10T13:15:00Z'), 'Add rhythm/heatmap section', [{ path: 'src/report/sections/rhythm.ts', additions: 165, deletions: 0 }]),
    makeCommit('q7r8s9t', 'Marcus Rivera', 'marcus@example.com', new Date('2024-04-18T11:30:00Z'), 'Implement epilogue section', [{ path: 'src/report/sections/epilogue.ts', additions: 100, deletions: 0 }]),
    makeCommit('r8s9t0u', 'Aiko Tanaka', 'aiko@example.com', new Date('2024-04-25T15:00:00Z'), 'Add CSS styles and responsive layout', [{ path: 'src/report/styles.ts', additions: 450, deletions: 20 }]),
    makeCommit('s9t0u1v', 'Dmitri Volkov', 'dmitri@example.com', new Date('2024-05-03T09:00:00Z'), 'Add IntersectionObserver animations', [{ path: 'src/report/generator.ts', additions: 80, deletions: 10 }]),
    makeCommit('t0u1v2w', 'Sarah Chen', 'sarah@example.com', new Date('2024-05-12T14:20:00Z'), 'Implement counter animation with RAF', [{ path: 'src/report/generator.ts', additions: 60, deletions: 5 }]),
    makeCommit('u1v2w3x', 'Priya Sharma', 'priya@example.com', new Date('2024-05-20T10:45:00Z'), 'Add tooltip interactions for charts', [{ path: 'src/report/sections/pulse.ts', additions: 70, deletions: 12 }]),
    makeCommit('v2w3x4y', 'Marcus Rivera', 'marcus@example.com', new Date('2024-06-01T08:30:00Z'), 'Fix mobile responsive breakpoints', [{ path: 'src/report/styles.ts', additions: 85, deletions: 40 }]),
    makeCommit('w3x4y5z', 'Priya Sharma', 'priya@example.com', new Date('2024-06-10T12:00:00Z'), 'Add noise filter SVG overlay', [{ path: 'src/report/generator.ts', additions: 30, deletions: 2 }]),
    makeCommit('x4y5z6a', 'Sarah Chen', 'sarah@example.com', new Date('2024-06-28T16:00:00Z'), 'Polish final output and add meta tags', [{ path: 'src/report/generator.ts', additions: 45, deletions: 15 }]),
  ];

  // Build chapters from the commit timeline
  const chapters: Chapter[] = [
    {
      title: 'Foundation',
      description: 'Initial project scaffolding, type system, and core infrastructure',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-02-04'),
      commits: commits.slice(0, 5),
      contributors: [contributors[0], contributors[1]],
      totalAdditions: 515,
      totalDeletions: 5,
      dominantPaths: ['src/', 'package.json', 'tsconfig.json'],
      intensity: 0.6,
    },
    {
      title: 'Core Engine',
      description: 'Building the analysis pipeline — chapters, contributors, and activity modules',
      startDate: new Date('2024-02-05'),
      endDate: new Date('2024-03-30'),
      commits: commits.slice(5, 14),
      contributors: [contributors[0], contributors[1], contributors[2], contributors[3]],
      totalAdditions: 1425,
      totalDeletions: 38,
      dominantPaths: ['src/narrative/', 'src/utils/', 'src/report/'],
      intensity: 0.9,
    },
    {
      title: 'Visual Layer',
      description: 'Designing the HTML report sections, D3 charts, and interactive elements',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-05-25'),
      commits: commits.slice(14, 21),
      contributors: [contributors[0], contributors[1], contributors[2], contributors[3], contributors[4]],
      totalAdditions: 1115,
      totalDeletions: 87,
      dominantPaths: ['src/report/sections/', 'src/report/styles.ts'],
      intensity: 1.0,
    },
    {
      title: 'Polish & Ship',
      description: 'Responsive design fixes, accessibility improvements, and final polish',
      startDate: new Date('2024-05-26'),
      endDate: new Date('2024-06-28'),
      commits: commits.slice(21),
      contributors: [contributors[0], contributors[1], contributors[4]],
      totalAdditions: 160,
      totalDeletions: 57,
      dominantPaths: ['src/report/'],
      intensity: 0.4,
    },
  ];

  // Daily activity spanning Jan–Jun 2024
  const dailyActivity: DailyActivity[] = [];
  const activityStart = new Date('2024-01-10');
  const activityEnd = new Date('2024-06-28');
  for (let d = new Date(activityStart); d <= activityEnd; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    // Simulate realistic activity: weekdays have more, some days zero
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const base = isWeekend ? 0 : Math.floor(Math.random() * 5);
    if (base > 0) {
      dailyActivity.push({
        date: iso,
        count: base,
        additions: base * 40 + Math.floor(Math.random() * 50),
        deletions: base * 8 + Math.floor(Math.random() * 15),
      });
    }
  }

  return {
    repoName: 'gitstory',
    title: 'The Story of gitstory',
    totalCommits: commits.length,
    totalContributors: contributors.length,
    totalAdditions: 18000,
    totalDeletions: 3350,
    firstCommitDate: new Date('2024-01-10'),
    lastCommitDate: new Date('2024-06-28'),
    chapters,
    contributors,
    dailyActivity,
    commits,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HTML Validation — full report from fixture data', () => {
  let html: string;
  let fixtureData: StoryData;

  beforeAll(() => {
    fixtureData = buildFixtureData();
    html = generateHTML(fixtureData);
  });

  // --- Document structure ---

  it('starts with a <!DOCTYPE html> declaration', () => {
    expect(html.trimStart().startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('contains a valid meta viewport tag', () => {
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  });

  it('contains a <title> element with the report title', () => {
    expect(html).toContain('<title>The Story of gitstory</title>');
  });

  // --- Section IDs ---

  it.each([
    'hero',
    'prologue',
    'pulse',
    'story',
    'cast',
    'rhythm',
    'epilogue',
  ])('contains section id="%s"', (sectionId) => {
    expect(html).toContain(`id="${sectionId}"`);
  });

  // --- External resources ---

  it('includes D3.js v7 CDN script tag', () => {
    expect(html).toContain('d3.v7.min.js');
  });

  it('includes Google Fonts link with Inter', () => {
    expect(html).toContain('fonts.googleapis.com');
    expect(html).toContain('Inter');
  });

  it('includes Google Fonts link with JetBrains Mono', () => {
    expect(html).toContain('JetBrains+Mono');
  });

  // --- JavaScript behaviours ---

  it('contains IntersectionObserver code', () => {
    expect(html).toContain('IntersectionObserver');
  });

  it('contains counter animation code (animateCounter + requestAnimationFrame)', () => {
    expect(html).toContain('animateCounter');
    expect(html).toContain('requestAnimationFrame');
  });

  it('contains tooltip class or tooltip-related code', () => {
    expect(html).toMatch(/tooltip/i);
  });

  it('contains mouseover handler for pulse chart', () => {
    // The pulse script registers mouseover events
    const pulseScriptArea = html.slice(html.indexOf('id="pulse"'));
    expect(pulseScriptArea).toContain('mouseover');
  });

  it('contains mouseover handler for cast chart', () => {
    const castArea = html.slice(html.indexOf('id="cast"'));
    expect(castArea).toContain('mouseover');
  });

  it('contains mouseover handler for rhythm chart', () => {
    const rhythmArea = html.slice(html.indexOf('id="rhythm"'));
    expect(rhythmArea).toContain('mouseover');
  });

  // --- CSS ---

  it('contains responsive @media query for 768px', () => {
    expect(html).toContain('@media (max-width: 768px)');
  });

  it('contains responsive @media query for 375px', () => {
    expect(html).toContain('@media (max-width: 375px)');
  });

  // --- Embedded data ---

  it('embeds JSON data as STORY_DATA variable', () => {
    expect(html).toContain('const STORY_DATA =');
  });

  it('embedded data contains the repo name', () => {
    expect(html).toContain('"gitstory"');
  });

  // --- SVG noise filter ---

  it('contains noise filter SVG with feTurbulence element', () => {
    expect(html).toContain('feTurbulence');
    expect(html).toContain('fractalNoise');
  });

  // --- Contributors rendered in output ---

  it.each([
    'Sarah Chen',
    'Marcus Rivera',
    'Aiko Tanaka',
    'Dmitri Volkov',
    'Priya Sharma',
  ])('contains contributor name "%s" in the output', (name) => {
    expect(html).toContain(name);
  });

  // --- Chapter titles rendered ---

  it.each([
    'Foundation',
    'Core Engine',
    'Visual Layer',
    'Polish &amp; Ship',
  ])('contains chapter title "%s" in the output', (title) => {
    // The generator escapes HTML, so & becomes &amp;
    expect(html).toContain(title);
  });

  // --- Stat values ---

  it('contains the total commit count as a data attribute or text', () => {
    const commitCount = fixtureData.totalCommits.toString();
    expect(html).toContain(commitCount);
  });

  it('contains the total contributor count', () => {
    const contribCount = fixtureData.totalContributors.toString();
    expect(html).toContain(contribCount);
  });

  // --- Sanity: output size ---

  it('generates a non-trivial HTML document (> 5 KB)', () => {
    expect(html.length).toBeGreaterThan(5000);
  });
});
