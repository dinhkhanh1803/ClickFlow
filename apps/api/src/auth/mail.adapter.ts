import nodemailer, { type Transporter } from 'nodemailer';

export interface PasswordResetMail { to: string; resetUrl: string; expiresAt: Date; }
export interface EmailVerificationMail { to: string; displayName: string; verificationUrl: string; expiresAt: Date; }

export abstract class MailAdapter {
  abstract sendPasswordReset(mail: PasswordResetMail): Promise<void>;
  abstract sendEmailVerification(mail: EmailVerificationMail): Promise<void>;
}

export class FakeMailAdapter extends MailAdapter {
  readonly passwordResets: PasswordResetMail[] = [];
  readonly verifications: EmailVerificationMail[] = [];
  get sent(): PasswordResetMail[] { return this.passwordResets; }
  sendPasswordReset(mail: PasswordResetMail): Promise<void> { this.passwordResets.push(mail); return Promise.resolve(); }
  sendEmailVerification(mail: EmailVerificationMail): Promise<void> { this.verifications.push(mail); return Promise.resolve(); }
}

export class SmtpMailAdapter extends MailAdapter {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor() {
    super();
    const port = Number(process.env.SMTP_PORT ?? process.env.EMAIL_PORT ?? 587);
    this.from = process.env.MAIL_FROM ?? process.env.EMAIL_FROM ?? 'ClickFlow <no-reply@clickflow.local>';
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? process.env.EMAIL_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: (process.env.SMTP_USER ?? process.env.EMAIL_USER) ? { user: process.env.SMTP_USER ?? process.env.EMAIL_USER, pass: process.env.SMTP_PASSWORD ?? process.env.EMAIL_PASS } : undefined
    });
  }

  sendPasswordReset(mail: PasswordResetMail): Promise<void> {
    return this.send(mail.to, 'Reset your ClickFlow password', 'Reset password', 'We received a request to reset your ClickFlow password.', mail.resetUrl, 'Reset password', mail.expiresAt);
  }

  sendEmailVerification(mail: EmailVerificationMail): Promise<void> {
    return this.send(mail.to, 'Verify your ClickFlow email', `Welcome, ${mail.displayName}`, 'Verify your email address to activate your ClickFlow account.', mail.verificationUrl, 'Verify email', mail.expiresAt);
  }

  private async send(to: string, subject: string, heading: string, message: string, url: string, action: string, expiresAt: Date): Promise<void> {
    await this.transporter.sendMail({
      from: this.from, to, subject,
      text: `${message}\n\n${action}: ${url}\n\nThis link expires at ${expiresAt.toISOString()}.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#0f172a"><h1 style="font-size:24px">${heading}</h1><p>${message}</p><p style="margin:28px 0"><a href="${url}" style="background:#4f46e5;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${action}</a></p><p style="font-size:12px;color:#64748b">This link expires at ${expiresAt.toISOString()}.</p></div>`
    });
  }
}

export const configuredMailAdapter = () => (process.env.SMTP_HOST ?? process.env.EMAIL_HOST) ? new SmtpMailAdapter() : new FakeMailAdapter();
