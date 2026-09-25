import type { Result } from '../domain/model/types';

export const fail = (reason: string): Result => ({ ok: false, reason });
