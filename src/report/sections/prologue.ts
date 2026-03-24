import type { StoryData } from '../../types.js';

export function generatePrologue(data: StoryData): string {
  return `
  <section id="prologue" class="fade-in">
    <h2 class="section-title">The Numbers</h2>
    <div class="prologue-counters">
      <div class="prologue-counter">
        <span class="counter" data-target="${data.totalCommits}">0</span>
        <span class="counter-label">Commits</span>
      </div>
      <div class="prologue-counter">
        <span class="counter" data-target="${data.totalContributors}">0</span>
        <span class="counter-label">Contributors</span>
      </div>
      <div class="prologue-counter">
        <span class="counter" data-target="${data.totalAdditions}">0</span>
        <span class="counter-label">Lines Added</span>
      </div>
      <div class="prologue-counter">
        <span class="counter" data-target="${data.totalDeletions}">0</span>
        <span class="counter-label">Lines Deleted</span>
      </div>
    </div>
  </section>`;
}
