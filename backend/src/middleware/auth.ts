import type { Request, Response, NextFunction } from 'express';
import { supabaseServer } from '../services/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
  token?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_HEADER_MISSING',
      message: 'Authentication token required in Authorization header (Bearer <token>).',
    });
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_HEADER_INVALID',
      message: 'Invalid authorization header format. Expected Bearer <token>.',
    });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'TOKEN_EMPTY',
      message: 'Authentication token is empty.',
    });
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser(token);

    if (error || !user) {
      // Safe diagnostic logging (no token or sensitive credentials logged)
      console.error('Supabase token verification failed:', {
        status: error?.status,
        message: error?.message,
        name: error?.name,
      });

      const isConfigError =
        error?.message?.toLowerCase().includes('api key') ||
        error?.message?.toLowerCase().includes('apikey');

      const message = isConfigError
        ? 'Backend Supabase authentication service configuration error. Check server API keys.'
        : 'Invalid or expired session token. Please sign in again.';

      res.status(401).json({
        error: 'Unauthorized',
        code: isConfigError ? 'CONFIG_ERROR' : 'INVALID_OR_EXPIRED_TOKEN',
        message,
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
    };
    req.token = token;

    next();
  } catch (err: unknown) {
    console.error('Authentication verification exception:', err);

    res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_VERIFICATION_EXCEPTION',
      message: 'Authentication verification failed.',
    });
  }
}
