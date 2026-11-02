import type { Request, Response } from 'express';
import { getAuth, parse } from '@kta/service-kit';
import { PreferencesSchema } from '@kta/shared-types';
import { profileService } from './profile.service';
import { RegisterSchema } from './profile.validation';

export async function register(req: Request, res: Response): Promise<void> {
  const created = await profileService.register(parse(RegisterSchema, req.body));
  res.status(201).json({
    success: true,
    message: "User register successfully",
    created: created});
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json(await profileService.me(getAuth(req).userId));
}

export async function updatePreferences(req: Request, res: Response): Promise<void> {
  const prefs = parse(PreferencesSchema, req.body);
  res.json(await profileService.updatePreferences(getAuth(req).userId, prefs));
}
