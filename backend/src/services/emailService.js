const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
    } else {
      console.warn('SendGrid API key not configured');
      this.isConfigured = false;
    }
  }

  async sendEmail(to, subject, html, from = process.env.EMAIL_FROM) {
    if (!this.isConfigured) {
      console.log('Email would be sent:', { to, subject, html });
      return true;
    }

    try {
      const msg = {
        to,
        from,
        subject,
        html
      };
      
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email, resetUrl) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #4CAF50; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 4px;
              margin: 10px 0;
            }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PRO Management</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>You requested to reset your password. Click the button below to reset it:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>This link will expire in 10 minutes.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, 'Password Reset Request', html);
  }

  async sendExpiryNotification(email, documentName, customerName, expiryDate, daysLeft) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .warning { color: #f44336; font-weight: bold; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Expiry Alert</h1>
            </div>
            <div class="content">
              <h2>Document Expiring Soon</h2>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Document:</strong> ${documentName}</p>
              <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
              <p><strong>Days Left:</strong> <span class="warning">${daysLeft} days</span></p>
              <p>Please take necessary action to renew this document.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from PRO Management System.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      email,
      `Document Expiry Alert: ${documentName} expiring in ${daysLeft} days`,
      html
    );
  }
}

module.exports = new EmailService();