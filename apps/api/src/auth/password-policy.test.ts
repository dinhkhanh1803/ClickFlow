import { BadRequestException } from '@nestjs/common';

import { validatePasswordPolicy } from './password-policy';

describe('validatePasswordPolicy', () => {
  it('accepts a strong password', () => {
    expect(() => validatePasswordPolicy('Correct-Horse-9!')).not.toThrow();
  });

  it.each(['short1!', 'alllowercase9!', 'ALLUPPERCASE9!', 'NoNumberHere!'])('rejects weak passwords', (password) => {
    expect(() => validatePasswordPolicy(password)).toThrow(BadRequestException);
  });
});
