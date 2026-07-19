import { GoogleIdentityVerifier } from './google-identity.verifier';

const verifyIdToken = vi.hoisted(() => vi.fn());
vi.mock('google-auth-library', () => ({
  OAuth2Client: class { verifyIdToken = verifyIdToken; }
}));

describe('GoogleIdentityVerifier', () => {
  beforeEach(() => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'web-client-id');
    verifyIdToken.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it('returns only verified identity claims', async () => {
    verifyIdToken.mockResolvedValue({ getPayload: () => ({
      sub: 'google-subject', email: 'Person@Gmail.com', email_verified: true,
      name: 'Google Person', picture: 'https://example.test/avatar.png'
    }) });

    await expect(new GoogleIdentityVerifier().verify('x'.repeat(100))).resolves.toEqual({
      subject: 'google-subject', email: 'person@gmail.com', displayName: 'Google Person',
      avatarUrl: 'https://example.test/avatar.png', hostedDomain: null
    });
    expect(verifyIdToken).toHaveBeenCalledWith({ idToken: 'x'.repeat(100), audience: 'web-client-id' });
  });

  it('rejects an unverified email', async () => {
    verifyIdToken.mockResolvedValue({ getPayload: () => ({ sub: 'google-subject', email: 'person@example.com', email_verified: false }) });
    await expect(new GoogleIdentityVerifier().verify('x'.repeat(100))).rejects.toMatchObject({ status: 401 });
  });
});
