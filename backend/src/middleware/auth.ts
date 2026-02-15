import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  apiKey?: string;
}

export const apiKeyAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'API key is required (x-api-key header)',
    });
    return;
  }

  const validKeys = (process.env.VALID_API_KEYS || '').split(',').map(k => k.trim());

  if (!validKeys.includes(apiKey)) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Invalid API key',
    });
    return;
  }

  req.apiKey = apiKey;
  next();
};
