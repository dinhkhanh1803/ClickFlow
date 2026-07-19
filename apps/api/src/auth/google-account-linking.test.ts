import { decideGoogleAccountLink } from './google-account-linking';

describe('Google account linking rules', () => {
  it('logs in an identity already linked by Google subject', () => {
    expect(decideGoogleAccountLink({ linkedUserId: 'user-1', existingEmailUserId: null, email: 'user@example.com', hostedDomain: null }))
      .toEqual({ kind: 'USE_LINKED_USER', userId: 'user-1' });
  });

  it('creates a new account when the verified Google email is unused', () => {
    expect(decideGoogleAccountLink({ linkedUserId: null, existingEmailUserId: null, email: 'new@example.com', hostedDomain: null }))
      .toEqual({ kind: 'CREATE_USER' });
  });

  it.each([
    ['person@gmail.com', null],
    ['person@company.com', 'company.com'],
  ])('links an authoritative Google email to an existing account', (email, hostedDomain) => {
    expect(decideGoogleAccountLink({ linkedUserId: null, existingEmailUserId: 'user-1', email, hostedDomain }))
      .toEqual({ kind: 'LINK_EXISTING_USER', userId: 'user-1' });
  });

  it('requires password confirmation before linking a non-authoritative third-party email', () => {
    expect(decideGoogleAccountLink({ linkedUserId: null, existingEmailUserId: 'user-1', email: 'person@example.com', hostedDomain: null }))
      .toEqual({ kind: 'REQUIRE_ACCOUNT_LINK' });
  });
});
