import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly from?: string;
  readonly frontendUrl: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('EMAIL_USERNAME');
    const pass = config.get<string>('EMAIL_PASSWORD');
    this.frontendUrl = config.get('FRONTEND_URL', 'http://localhost:3000');
    if (user && pass) {
      this.from = `Faceatutor <${user}>`;
      this.transporter = nodemailer.createTransport({
        service: config.get('EMAIL_SERVICE', 'Gmail'),
        auth: { user, pass },
      });
    } else {
      this.logger.warn('No email credentials: emails are printed to the console');
    }
  }

  /** Never throws: a mail failure must not break the business action. */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(`[mail to ${to}] ${subject}\n${html.replace(/<[^>]+>/g, ' ')}`);
      return true;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send "${subject}" to ${to}`, error);
      return false;
    }
  }

  link(path: string) {
    return `${this.frontendUrl}${path}`;
  }

  layout(title: string, body: string, action?: { label: string; url: string }) {
    const button = action
      ? `<p><a href="${action.url}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${action.label}</a></p>
         <p style="color:#6b7280;font-size:12px">${action.url}</p>`
      : '';
    return `<div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="color:#0b0840">${title}</h2>${body}${button}
      <p style="color:#6b7280">— Faceatutor</p></div>`;
  }
}
