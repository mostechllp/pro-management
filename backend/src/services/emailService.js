const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
      console.log('✅ SendGrid configured successfully');
    } else {
      console.warn('⚠️ SendGrid API key not configured');
      this.isConfigured = false;
    }
  }

  async sendEmail(to, subject, html, from = process.env.EMAIL_FROM) {
    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 From: ${from}`);
    console.log(`📧 Configured: ${this.isConfigured}`);

    if (!this.isConfigured) {
      console.log('⚠️ Email would be sent (SendGrid not configured):', { to, subject });
      return true;
    }

    try {
      const msg = {
        to,
        from,
        subject,
        html
      };
      
      const response = await sgMail.send(msg);
      console.log(`✅ Email sent successfully to ${to}`);
      console.log(`✅ Response:`, response[0]?.statusCode);
      return true;
    } catch (error) {
      console.error('❌ Email send error:', error);
      if (error.response) {
        console.error('❌ SendGrid error response:', error.response.body);
      }
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

  async sendExpiryNotification(email, documentName, customerName, expiryDate, daysLeft, isUrgent = false) {
    const urgencyLevel = isUrgent || daysLeft <= 1 ? '🚨 URGENT' : '⚠️ Reminder';
    const urgencyColor = isUrgent || daysLeft <= 1 ? '#dc3545' : '#ff9800';
    const urgencyBg = isUrgent || daysLeft <= 1 ? '#ffebee' : '#fff3e0';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${urgencyColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .warning { color: ${urgencyColor}; font-weight: bold; }
            .urgent-box { 
              background: ${urgencyBg}; 
              border-left: 4px solid ${urgencyColor}; 
              padding: 15px; 
              margin: 15px 0;
              border-radius: 4px;
            }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
            .button {
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${urgencyLevel}</h1>
              <p>Document Expiry Alert</p>
            </div>
            <div class="content">
              <h2>Document Expiring ${daysLeft <= 1 ? 'TODAY' : 'Soon'}</h2>
              
              <div class="urgent-box">
                <p><strong>📄 Document:</strong> ${documentName}</p>
                <p><strong>👤 Customer:</strong> ${customerName}</p>
                <p><strong>📅 Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p><strong>⏰ Days Left:</strong> <span class="warning">${daysLeft} day${daysLeft > 1 ? 's' : ''}</span></p>
              </div>

              ${daysLeft <= 1 ? `
                <div style="background: #dc3545; color: white; padding: 15px; border-radius: 4px; text-align: center; margin: 15px 0;">
                  <strong>🚨 URGENT ACTION REQUIRED!</strong>
                  <p style="margin: 5px 0 0 0;">This document expires ${daysLeft === 0 ? 'today' : 'tomorrow'}!</p>
                </div>
              ` : ''}

              <p style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/documents" class="button">
                  View Documents
                </a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from PRO Management System.</p>
              <p>Please take necessary action to renew this document.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const subject = `${urgencyLevel}: ${documentName} expiring in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();