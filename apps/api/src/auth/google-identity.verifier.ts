import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  hostedDomain: string | null;
}

@Injectable()
export class GoogleIdentityVerifier {
  private readonly client = new OAuth2Client();

  async verify(credential: string): Promise<VerifiedGoogleIdentity> {
    const audience = process.env.GOOGLE_CLIENT_ID;
    if (!audience) throw new ServiceUnavailableException('Google sign-in is not configured');
    try {
      const ticket = await this.client.verifyIdToken({ idToken: credential, audience });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw new UnauthorizedException('Google identity is invalid');
      }
      const email = payload.email.trim().toLowerCase();
      return {
        subject: payload.sub,
        email,
        displayName: payload.name?.trim() || email.split('@')[0] || 'ClickFlow User',
        avatarUrl: payload.picture ?? null,
        hostedDomain: payload.hd ?? null
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Google identity is invalid');
    }
  }
}
