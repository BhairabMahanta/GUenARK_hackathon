import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables immediately
dotenv.config();

class EmailService {
  private transporter: Transporter;
  
  constructor() {
    const smtpEmail = process.env.SMTP_EMAIL || process.env.EMAIL_USER;
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');



    console.log('[EMAIL] Initializing with config:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpEmail || 'NOT SET',
      pass: smtpPassword ? '***SET***' : 'NOT SET'
    });

    // Check if credentials exist
    if (!smtpEmail || !smtpPassword) {
      console.warn('[EMAIL] ⚠️ SMTP credentials not found in environment variables');
      console.warn('[EMAIL] Please set SMTP_EMAIL and SMTP_PASSWORD in .env file');
      console.warn('[EMAIL] Emails will be logged to console only');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: smtpEmail && smtpPassword ? {
        user: smtpEmail,
        pass: smtpPassword
      } : undefined,
      tls: {
        rejectUnauthorized: false // For development
      }
    });
  }

  async sendVerificationEmail(email: string, username: string, otp: string): Promise<any> {
    console.log(`[EMAIL] Sending verification email to ${email}`);
    console.log(`[EMAIL] 🔑 OTP: ${otp}`);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 30px 20px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 10px;">🌊</div>
      <h2 style="margin: 0; font-size: 24px;">Guwahati Flood Alert System</h2>
    </div>
    <div style="padding: 30px; color: #374151;">
      <h3>Welcome, ${username}!</h3>
      <p>Thank you for registering with the Guwahati Flood Alert System. Please verify your email address to complete your registration.</p>
      
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px solid #2563eb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Your Verification Code</p>
        <p style="font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #1e40af; font-family: 'Courier New', monospace; margin: 10px 0;">${otp}</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;">⏱️ <strong>This code expires in 15 minutes</strong></p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
    </div>
    <div style="text-align: center; padding: 20px; background-color: #f9fafb; color: #6b7280; font-size: 12px;">
      <p>Guwahati Flood Alert System</p>
      <p>Keeping Guwahati Safe 🌊</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_EMAIL || 'noreply@floodprediction.com',
        to: email,
        subject: '🌊 Verify Your Email - Guwahati Flood Alert',
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EMAIL] ✅ Verification email sent successfully:', info.messageId);
      return info;
    } catch (error: any) {
      console.error('[EMAIL] ❌ Failed to send email:', error.message);
      console.log('[EMAIL] 📋 Email content (for manual testing):');
      console.log(`[EMAIL] To: ${email}`);
      console.log(`[EMAIL] OTP: ${otp}`);
      // Don't throw - allow registration to continue
      return null;
    }
  }

  async sendPasswordResetEmail(email: string, username: string, otp: string): Promise<any> {
    console.log(`[EMAIL] Sending password reset email to ${email}`);
    console.log(`[EMAIL] 🔑 Reset OTP: ${otp}`);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 30px 20px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 10px;">🔐</div>
      <h2 style="margin: 0; font-size: 24px;">Password Reset Request</h2>
    </div>
    <div style="padding: 30px; color: #374151;">
      <h3>Hello, ${username}</h3>
      <p>We received a request to reset your password. Use the code below to proceed:</p>
      
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px solid #dc2626;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Your Password Reset Code</p>
        <p style="font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #991b1b; font-family: 'Courier New', monospace; margin: 10px 0;">${otp}</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;">⏱️ <strong>This code expires in 15 minutes</strong></p>
      </div>
      
      <p style="color: #dc2626; font-weight: bold;">⚠️ If you didn't request this, please ignore this email.</p>
    </div>
    <div style="text-align: center; padding: 20px; background-color: #f9fafb; color: #6b7280; font-size: 12px;">
      <p>Guwahati Flood Alert System</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_EMAIL || 'noreply@floodprediction.com',
        to: email,
        subject: '🔐 Password Reset Code - Guwahati Flood Alert',
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EMAIL] ✅ Password reset email sent successfully:', info.messageId);
      return info;
    } catch (error: any) {
      console.error('[EMAIL] ❌ Failed to send email:', error.message);
      console.log(`[EMAIL] 📋 Reset OTP (for manual testing): ${otp}`);
      return null;
    }
  }

  async sendNotificationEmail(email: string, subject: string, message: string): Promise<any> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_EMAIL || 'noreply@floodprediction.com',
        to: email,
        subject: subject,
        html: `<p>${message}</p>`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EMAIL] ✅ Notification sent:', info.messageId);
      return info;
    } catch (error: any) {
      console.error('[EMAIL] ❌ Failed to send notification:', error.message);
      return null;
    }
  }
}

export default new EmailService();
