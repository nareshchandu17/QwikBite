import nodemailer from 'nodemailer';

/**
 * Reusable email transporter using SMTP.
 * Configure these in your .env file.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends an email using the configured transporter.
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  // If no SMTP credentials, log to console as fallback (prevents crashes)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not found in .env. Email was NOT sent. Logging content instead:');
    console.log({ to, subject, text });
    return { success: false, error: 'SMTP credentials missing' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'qwikBite'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error('Email delivery failed. Please check your SMTP settings.');
  }
}
