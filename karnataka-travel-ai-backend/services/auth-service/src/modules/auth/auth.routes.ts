import { Router } from 'express';
import { asyncHandler } from '@kta/service-kit';
import { login, logout, refresh, verifyToken } from './auth.controller';

export const authRouter = Router();
authRouter.post('/login', asyncHandler(login));
authRouter.post('/refresh-token', asyncHandler(refresh));
authRouter.post('/logout', asyncHandler(logout));
authRouter.post('/verify-token', asyncHandler(verifyToken)); // internal: blocked at the public gateway
