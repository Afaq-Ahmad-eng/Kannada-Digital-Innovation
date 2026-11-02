import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, parse, requireAuth, z } from '@kta/service-kit';
import { translateVoice } from './translation.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

const Fields = z.object({
  text: z.string().max(500).optional(),
  sourceLang: z.enum(['kn', 'en', 'auto']).default('auto'),
  context: z.string().max(200).optional(),
  speak: z.enum(['true', 'false']).default('true'),
});

export const translationRouter = Router();
translationRouter.post(
  '/translate-voice',
  requireAuth,
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    const f = parse(Fields, req.body ?? {});
    const out = await translateVoice({
      audio: req.file ? { buffer: req.file.buffer, filename: req.file.originalname || 'speech.webm', mimeType: req.file.mimetype } : undefined,
      text: f.text,
      sourceLang: f.sourceLang,
      context: f.context,
      speak: f.speak === 'true',
    });
    res.json(out);
  }),
);
