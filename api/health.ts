import type { Request, Response } from 'express';
import { savedMattersStore, searchCache } from './_lib/store.ts';

export default function healthHandler(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    service: 'case-finder',
    timestamp: new Date().toISOString(),
    cachedQueries: searchCache.size,
    savedMatters: savedMattersStore.length,
  });
}
