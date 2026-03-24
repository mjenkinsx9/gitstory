export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  subject: string;
  body: string;
  files: FileChange[];
}

export interface ContributorSummary {
  name: string;
  email: string;
  commitCount: number;
  additions: number;
  deletions: number;
  firstCommit: Date;
  lastCommit: Date;
}

export interface Chapter {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  commits: GitCommit[];
  contributors: ContributorSummary[];
  totalAdditions: number;
  totalDeletions: number;
  dominantPaths: string[];
  intensity: number; // normalized 0-1
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
  additions: number;
  deletions: number;
}

export interface StoryData {
  repoName: string;
  title: string;
  totalCommits: number;
  totalContributors: number;
  totalAdditions: number;
  totalDeletions: number;
  firstCommitDate: Date;
  lastCommitDate: Date;
  chapters: Chapter[];
  contributors: ContributorSummary[];
  dailyActivity: DailyActivity[];
  commits: GitCommit[];
}

export interface AnalyzeOptions {
  output: string;
  maxCommits?: number;
  title?: string;
}
