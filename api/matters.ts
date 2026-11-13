import type { Request, Response } from 'express';
import { savedMattersStore, type StoredSavedMatter } from './_lib/store.ts';

export default function mattersHandler(req: Request, res: Response): void {
  if (req.method === 'GET') {
    res.status(200).json({ matters: savedMattersStore });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body as Partial<StoredSavedMatter> | undefined;
    if (!body || typeof body.matterName !== 'string' || !body.matterName.trim()) {
      res.status(400).json({
        statusCode: 400,
        message: 'Matter name is required.',
        url: '/api/matters',
      });
      return;
    }

    const matter: StoredSavedMatter = {
      id: typeof body.id === 'string' && body.id ? body.id : `matter-${Date.now()}`,
      matterName: body.matterName.trim(),
      problemDescription:
        typeof body.problemDescription === 'string' ? body.problemDescription : '',
      searchQuery: typeof body.searchQuery === 'string' ? body.searchQuery : '',
      savedAt:
        typeof body.savedAt === 'string' && body.savedAt
          ? body.savedAt
          : new Date().toISOString().slice(0, 10),
      cases: Array.isArray(body.cases) ? body.cases : [],
      brief: typeof body.brief === 'string' ? body.brief : '',
    };

    savedMattersStore.unshift(matter);
    res.status(201).json({ matter });
    return;
  }

  res.status(405).json({
    statusCode: 405,
    message: `Method ${req.method} not allowed.`,
    url: '/api/matters',
  });
}
