export type GoogleAccountLinkDecision =
  | { kind: 'USE_LINKED_USER'; userId: string }
  | { kind: 'LINK_EXISTING_USER'; userId: string }
  | { kind: 'CREATE_USER' }
  | { kind: 'REQUIRE_ACCOUNT_LINK' };

export function isGoogleAuthoritativeForEmail(email: string, hostedDomain: string | null): boolean {
  return email.toLowerCase().endsWith('@gmail.com') || Boolean(hostedDomain);
}

export function decideGoogleAccountLink(input: {
  linkedUserId: string | null;
  existingEmailUserId: string | null;
  email: string;
  hostedDomain: string | null;
}): GoogleAccountLinkDecision {
  if (input.linkedUserId) return { kind: 'USE_LINKED_USER', userId: input.linkedUserId };
  if (!input.existingEmailUserId) return { kind: 'CREATE_USER' };
  if (isGoogleAuthoritativeForEmail(input.email, input.hostedDomain)) {
    return { kind: 'LINK_EXISTING_USER', userId: input.existingEmailUserId };
  }
  return { kind: 'REQUIRE_ACCOUNT_LINK' };
}
