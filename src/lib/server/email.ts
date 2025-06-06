// src/lib/server/email.ts
import { env } from '$env/dynamic/private';

// Dynamic import for SendGrid with fallback
let sgMail: any = null;
let sgMailError: string | null = null;

async function initializeSendGrid() {
  if (sgMail !== null) return sgMail;
  
  try {
    const sendGridModule = await import('@sendgrid/mail');
    sgMail = sendGridModule.default;
    
    // Initialize SendGrid
    if (env.SENDGRID_API_KEY) {
      sgMail.setApiKey(env.SENDGRID_API_KEY);
      console.log('SendGrid initialized successfully');
    } else {
      console.warn('SENDGRID_API_KEY not found. Email service will not work.');
    }
    
    return sgMail;
  } catch (error) {
    sgMailError = `SendGrid not available: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.warn(sgMailError);
    console.log('To install SendGrid, run: npm install @sendgrid/mail');
    return null;
  }
}

/**
 * Send an email using SendGrid
 * @param options Email options
 * @returns Promise with send result
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<{ success: boolean; message: string; info?: any }> {
  try {
    const sgMailClient = await initializeSendGrid();
    
    if (!sgMailClient) {
      return { 
        success: false, 
        message: sgMailError || 'SendGrid not available - please install @sendgrid/mail package' 
      };
    }

    if (!env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return { 
        success: false, 
        message: 'Email service not configured - missing SendGrid API key' 
      };
    }

    const from = env.EMAIL_FROM || 'noreply@civicslab.net';
    
    const msg = {
      to: options.to,
      from: from,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const response = await sgMailClient.send(msg);
    
    console.log(`Email sent successfully to ${options.to}`);
    
    return { 
      success: true, 
      message: 'Email sent successfully', 
      info: response 
    };
  } catch (error) {
    console.error('Failed to send email via SendGrid:', error);
    
    let errorMessage = 'Failed to send email';
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      if (sgError.response?.body?.errors) {
        errorMessage = sgError.response.body.errors.map((e: any) => e.message).join(', ');
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage 
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

You have been invited by ${inviterName} to join the "${workspaceName}" workspace on Civics Lab.

To accept this invitation, please click on the following link:
${inviteLink}

This invitation link will expire in 7 days.

Thank you,
The Civics Lab Team
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .workspace-info {
      background-color: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      margin: 25px 0;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-1px);
    }
    .link-fallback {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 4px;
      font-size: 14px;
      word-break: break-all;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .logo {
      color: white;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .header {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <div class="logo">Civics Lab</div>
        <h1>You're Invited!</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>You have been invited by <strong>${inviterName}</strong> to join a workspace on Civics Lab.</p>
        
        <div class="workspace-info">
          <strong>Workspace:</strong> ${workspaceName}
        </div>
        
        <p>Civics Lab helps political campaigns, advocacy groups, and civic organizations manage their contacts, businesses, and donations all in one place.</p>
        
        <p>To accept this invitation and get started, click the button below:</p>
        
        <div style="text-align: center;">
          <a href="${inviteLink}" class="button">Accept Invitation</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <div class="link-fallback">
          ${inviteLink}
        </div>
        
        <p><strong>Important:</strong> This invitation link will expire in 7 days.</p>
        
        <p>If you have any questions, please don't hesitate to reach out to the person who invited you.</p>
        
        <p>Welcome to Civics Lab!</p>
      </div>
      <div class="footer">
        <p>This is an automated email from Civics Lab. Please do not reply to this message.</p>
        <p>© ${new Date().getFullYear()} Civics Lab. All rights reserved.</p>
      </div>
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

/**
 * Send a Super Admin invitation email
 * @param options Options for the Super Admin invitation email
 * @returns Result of the email send operation
 */
export async function sendSuperAdminInviteEmail(options: {
  email: string;
  inviterName: string;
  inviteLink: string;
}): Promise<{ success: boolean; message: string; info?: any }> {
  const { email, inviterName, inviteLink } = options;
  
  const subject = `Invitation to become a Civics Lab Super Admin`;
  
  const text = `
Hello,

You have been invited by ${inviterName} to become a Super Admin on Civics Lab.

As a Super Admin, you will have access to:
- Global system administration features
- User management across all workspaces
- System-wide settings and configurations

To accept this invitation, please click on the following link:
${inviteLink}

This invitation link will expire in 7 days.

Thank you,
The Civics Lab Team
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .admin-info {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      margin: 25px 0;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-1px);
    }
    .link-fallback {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 4px;
      font-size: 14px;
      word-break: break-all;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .logo {
      color: white;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .privileges {
      background-color: #f8fafc;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    .privileges ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .header {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <div class="logo">Civics Lab</div>
        <h1>Super Admin Invitation</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>You have been invited by <strong>${inviterName}</strong> to become a <strong>Super Admin</strong> on Civics Lab.</p>
        
        <div class="admin-info">
          <strong>⚠️ Important:</strong> This is an administrative invitation with elevated privileges.
        </div>
        
        <p>As a Super Admin, you will have access to:</p>
        <div class="privileges">
          <ul>
            <li>Global system administration features</li>
            <li>User management across all workspaces</li>
            <li>System-wide settings and configurations</li>
            <li>Advanced administrative tools</li>
          </ul>
        </div>
        
        <p>To accept this invitation and gain Super Admin access, click the button below:</p>
        
        <div style="text-align: center;">
          <a href="${inviteLink}" class="button">Accept Super Admin Invitation</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <div class="link-fallback">
          ${inviteLink}
        </div>
        
        <p><strong>Important:</strong> This invitation link will expire in 7 days.</p>
        
        <p>If you have any questions about this invitation or your Super Admin responsibilities, please contact the person who invited you.</p>
        
        <p>Thank you,<br>The Civics Lab Team</p>
      </div>
      <div class="footer">
        <p>This is an automated email from Civics Lab. Please do not reply to this message.</p>
        <p>© ${new Date().getFullYear()} Civics Lab. All rights reserved.</p>
      </div>
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
