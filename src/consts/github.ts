export const ACTIVITY_STORE_LIMIT = 500;
export const ACTIVITY_VISIBLE_COUNT = 10;
export const ACTIVITY_PAGE_SIZE = 100;
export const ACTIVITY_WINDOW_DAYS = 365;

export const ACTIVITY_KINDS = ['commits', 'repository', 'pull_request', 'issue', 'review'] as const;
export const ACTIVITY_STATES = ['OPEN', 'MERGED', 'CLOSED'] as const;
export const ISSUE_STATES = ['OPEN', 'CLOSED'] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export type ActivityState = (typeof ACTIVITY_STATES)[number];
export type IssueState = (typeof ISSUE_STATES)[number];
