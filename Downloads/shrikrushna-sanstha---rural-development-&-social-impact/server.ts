import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { validateContactForm } from './src/utils/validation.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    organization: 'Shrikrushna Sanskrutik va Gramin Vikas Sanstha',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Contact form submission endpoint
 */
app.post('/api/contact', (req: Request, res: Response) => {
  try {
    const { name, contact, subject, message } = req.body;

    const validation = validateContactForm({
      name: String(name || ''),
      contact: String(contact || ''),
      subject: String(subject || ''),
      message: String(message || ''),
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'अवैध संपर्क तपशील (Invalid input)';
      return res.status(400).json({
        success: false,
        error: firstError,
        errors: validation.errors,
      });
    }

    console.log('[Contact Submission]', {
      name: validation.sanitized.name,
      contact: validation.sanitized.contact,
      subject: validation.sanitized.subject,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'आपला संदेश यशस्वीरित्या नोंदवला गेला आहे. आम्ही लवकरच संपर्क साधू.',
      messageEn: 'Your message has been received. We will get in touch shortly.',
    });
  } catch (err: any) {
    console.error('Contact endpoint error:', err);
    return res.status(500).json({
      success: false,
      error: 'सर्व्हर त्रुटी: कृपया पुन्हा प्रयत्न करा (Internal server error)',
    });
  }
});

/**
 * Mock API Endpoints (Development / Local Mock Only)
 *
 * SECURITY POLICY:
 * In production (NODE_ENV === 'production'), mock authentication and mock data APIs
 * are strictly disabled and return HTTP 404. Fallback credentials ('admin123',
 * 'shrikrushna2026') and base64 mock tokens are never exposed or evaluated in production.
 */
if (!isProd) {
  /**
   * Admin Authentication Endpoint (Development Mock Only)
   */
  app.post('/api/admin/login', (req: Request, res: Response) => {
    try {
      const { username, password } = req.body || {};
      const u = String(username || '').trim().toLowerCase();
      const p = String(password || '').trim();
      const configuredPass = process.env.ADMIN_PASSWORD || 'admin123';

      if (
        (u === 'admin' && (p === configuredPass || p === 'admin123' || p === 'shrikrushna2026')) ||
        (u === 'shrikrushna' && (p === configuredPass || p === 'admin123'))
      ) {
        const token = Buffer.from(`${u}:${Date.now()}:verified`).toString('base64');
        return res.json({
          success: true,
          token,
          user: { username: u, role: 'administrator' },
        });
      }

      return res.status(401).json({
        success: false,
        error: 'अवैध वापरकर्ता नाव किंवा पासवर्ड (Invalid username or password)',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'लॉगिन प्रक्रिया पूर्ण होऊ शकली नाही (Authentication error)',
      });
    }
  });

  /**
   * Data backup endpoint (Development Mock Only)
   */
  app.post('/api/cms/backup', (req: Request, res: Response) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'No data provided' });
      }
      return res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        recordCount: {
          initiatives: data.initiatives?.length || 0,
          gallery: data.gallery?.length || 0,
          videos: data.videos?.length || 0,
          reports: data.reports?.length || 0,
          announcements: data.announcements?.length || 0,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to process backup' });
    }
  });
} else {
  /**
   * Production Guard: Explicitly block all HTTP methods to mock endpoints.
   */
  app.all(['/api/admin/login', '/api/cms/backup'], (_req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      error: 'Not Found: Mock API endpoints are disabled in production.',
    });
  });
}

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
