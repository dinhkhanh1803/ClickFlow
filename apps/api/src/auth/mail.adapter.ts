export interface PasswordResetMail {
  to: string;
  resetUrl: string;
  expiresAt: Date;
}

export abstract class MailAdapter {
  abstract sendPasswordReset(mail: PasswordResetMail): Promise<void>;
}

export class FakeMailAdapter extends MailAdapter {
  readonly sent: PasswordResetMail[] = [];

  sendPasswordReset(mail: PasswordResetMail): Promise<void> {
    this.sent.push(mail);
    return Promise.resolve();
  }
}
