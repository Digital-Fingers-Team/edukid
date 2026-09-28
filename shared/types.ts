export type Kg = 1 | 2;
export type Stage = 1 | 2;
export type Level = 1 | 2 | 3 | 4 | 5;
export type Box = 1 | 2 | 3 | 4 | 5;

export interface Me { id: string; email: string }

export interface Child {
  id: string;
  name: string;
  kg: Kg;
  avatar: string;            // OpenMoji code
  stage: Stage;
  stageSince: string;        // YYYY-MM-DD (local)
  level: Level;
  recordingConsent: boolean;
  updatedAt: number;
}
export type ChildEditable = Pick<Child, 'name' | 'kg' | 'avatar' | 'stage' | 'stageSince' | 'level' | 'recordingConsent'>;

export interface PracticeSession {
  id: string;
  childId: string;
  date: string;              // YYYY-MM-DD (local)
  startedAt: number;         // epoch ms
  durationSec: number;
  levels: Level[];           // levels used, in order, no repeats in a row
  smooth: number;
  bumpy: number;
  corrections: number;
  note: string;
  updatedAt: number;
}
export interface Rating { childId: string; date: string; value: number; updatedAt: number }
export interface ItemProgress { childId: string; itemId: string; box: Box; dueAt: number; updatedAt: number }
export interface Sticker { childId: string; stickerId: string; earnedAt: number; updatedAt: number }
export interface RecordingMeta { id: string; childId: string; createdAt: number; durationSec: number; mime: string }

export interface SyncPayload {
  child: Child;
  sessions: PracticeSession[];
  ratings: Rating[];
  items: ItemProgress[];
  stickers: Sticker[];
  now: number;
}
