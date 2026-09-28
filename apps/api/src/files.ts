import { rm } from 'node:fs/promises';
import { join } from 'node:path';

export const childDir = (dataDir: string, childId: string) => join(dataDir, 'recordings', childId);

export async function removeChildFiles(dataDir: string, childId: string): Promise<void> {
  await rm(childDir(dataDir, childId), { recursive: true, force: true });
}
