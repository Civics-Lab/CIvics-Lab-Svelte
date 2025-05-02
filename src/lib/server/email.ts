// src/lib/server/email.ts
import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

// Create email transporter
let transporter: nodemailer.Transporter;

// Initialize the transporter based on environment
function getTransporter() {
  if (transporter) return transporter;

  // Check for environment variables
  const host = env.SMTP_HOST;
  const port = parseInt(env.SMTP_PORT || '587');
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.EMAIL_FROM || 'noreply@example.com';

  // If we're in development mode and don't have SMTP credentials,
  // use Ethereal for testing: https://ethereal.email/
  if (env.NODE_ENV !== 'production' && (!host || !user || !pass)) {
    console.log('Using ethereal email for development...');
    return createTestAccount();
  }

  if (!host || !user || !pass) {
    console.warn('Email configuration missing. Emails will not be sent.');
    return null;
  }

  // Create a real SMTP transporter
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

// Create a test account at Ethereal for development
async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('Created test email account:', testAccount.user);
    return transporter;
  } catch (error) {
    console.error('Failed to create test email account:', error);
    return null;
  }
}

/**
 * Send an email
 * @param options Email options
 * @returns Promise with send info or null if email service is not configured
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<{ success: boolean; message: string; info?: any }> {
  try {
    const emailTransporter = await getTransporter();
    
    if (!emailTransporter) {
      return { 
        success: false, 
        message: 'Email service not configured' 
      };
    }
    
    const from = env.EMAIL_FROM || 'noreply@example.com';
    
    const info = await emailTransporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    // For Ethereal email, log the URL where the message can be viewed
    if (env.NODE_ENV !== 'production' && info.messageId) {
      console.log('Email preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return { 
      success: true, 
      message: 'Email sent successfully', 
      info 
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Send a workspace invitation email
 * @param options Options for the invitation email
 * @returns Result of the email send operation
 */
export async function sendInviteEmail(options: {
  email: string;
  workspaceName: string;
  inviterName: string;
  inviteLink: string;
}): Promise<{ success: boolean; message: string; info?: any }> {
  const { email, workspaceName, inviterName, inviteLink } = options;
  
  const subject = `Invitation to join ${workspaceName} workspace`;
  
  const text = `
Hello,

You have been invited by ${inviterName} to join the "${workspaceName}" workspace.

To accept this invitation, please click on the following link:
${inviteLink}

This invitation link will expire in 7 days.

Thank you,
The Team
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2b6cb0;
      color: white;
      padding: 10px 20px;
      border-radius: 5px 5px 0 0;
    }
    .content {
      padding: 20px;
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
    }
    .button {
      display: inline-block;
      background-color: #4299e1;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 0.8em;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Workspace Invitation</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have been invited by <strong>${inviterName}</strong> to join the "<strong>${workspaceName}</strong>" workspace.</p>
      <p>To accept this invitation, please click on the button below:</p>
      <a href="${inviteLink}" class="button">Accept Invitation</a>
      <p>Or copy and paste this link into your browser:</p>
      <p><small>${inviteLink}</small></p>
      <p>This invitation link will expire in 7 days.</p>
      <p>Thank you,<br>The Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
