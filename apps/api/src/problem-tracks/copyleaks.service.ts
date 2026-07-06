import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlagiarismScanResult {
  scanned: boolean;
  provider: 'copyleaks' | 'skipped';
  similarityScore?: number;
  aiScore?: number;
  scanId?: string;
  message?: string;
}

@Injectable()
export class CopyleaksService {
  private readonly logger = new Logger(CopyleaksService.name);

  constructor(private config: ConfigService) {}

  async scanText(text: string): Promise<PlagiarismScanResult> {
    const email = this.config.get<string>('COPYLEAKS_EMAIL');
    const apiKey = this.config.get<string>('COPYLEAKS_API_KEY');

    if (!email || !apiKey || text.length < 50) {
      return {
        scanned: false,
        provider: 'skipped',
        message: 'Copyleaks not configured or text too short',
      };
    }

    try {
      const loginRes = await fetch('https://id.copyleaks.com/v3/account/login/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, key: apiKey }),
      });

      if (!loginRes.ok) throw new Error('Copyleaks login failed');
      const { access_token } = (await loginRes.json()) as { access_token: string };

      const scanId = `faralin-${Date.now()}`;
      const base64 = Buffer.from(text, 'utf-8').toString('base64');

      const submitRes = await fetch(`https://api.copyleaks.com/v3/scans/submit/file/${scanId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64,
          filename: 'submission.txt',
          properties: {
            sandbox: true,
            aiGeneratedText: { detect: true },
            scanning: {
              copyleaksDb: {
                includeMySubmissions: false,
                includeOthersSubmissions: true,
              },
            },
          },
        }),
      });

      if (!submitRes.ok) throw new Error('Copyleaks submit failed');

      return {
        scanned: true,
        provider: 'copyleaks',
        scanId,
        message: 'Scan submitted (async). Sandbox mode — results via webhook in production.',
        similarityScore: undefined,
        aiScore: undefined,
      };
    } catch (err) {
      this.logger.warn(`Copyleaks scan failed: ${err}`);
      return {
        scanned: false,
        provider: 'skipped',
        message: 'Copyleaks scan failed — using internal trust signals only',
      };
    }
  }
}
