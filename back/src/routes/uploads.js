import { Router } from 'express';
import multer from 'multer';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { isCloudinaryConfigured, uploadBuffer } from '../services/cloudinary.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter(_req, file, cb) {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Зөвхөн зураг хуулна'));
  },
});

const router = Router();

router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.array('files', 8),
  async (req, res, next) => {
    try {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ error: 'Cloudinary тохиргоо дутуу' });
      }
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ error: 'Зураг сонгоно уу' });
      const urls = await Promise.all(
        files.map((file) => uploadBuffer(file.buffer, { filename: file.originalname })),
      );
      res.status(201).json({ urls });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
