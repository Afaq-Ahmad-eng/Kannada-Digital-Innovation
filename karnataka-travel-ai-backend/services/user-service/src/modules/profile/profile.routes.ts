import { Router } from 'express';
import { asyncHandler, requireAuth } from '@kta/service-kit';
import { me, register, updatePreferences } from './profile.controller';

export const profileRouter = Router();
profileRouter.post('/register', asyncHandler(register));
profileRouter.get('/me', requireAuth, asyncHandler(me));
profileRouter.put('/me/preferences', requireAuth, asyncHandler(updatePreferences));
