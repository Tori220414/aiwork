const nodemailer = require('nodemailer');

/**
 * Email Service for sending notifications
 * Uses nodemailer with Gmail SMTP
 */

// Create reusable transporter
let transporter = null;

function createTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: true, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // Only create transporter if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env');
    return null;
  }

  transporter = nodemailer.createTransport(emailConfig);

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email service error:', error);
    } else {
      console.log('Email service is ready to send messages');
    }
  });

  return transporter;
}

/**
 * Send task assignment notification email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.assignedByName - Name of person who assigned the task
 * @param {string} options.taskTitle - Title of the task
 * @param {string} options.taskDescription - Description of the task
 * @param {string} options.workspaceName - Name of the workspace
 * @param {string} options.dueDate - Due date of the task (optional)
 * @param {string} options.priority - Priority of the task (optional)
 * @param {string} options.taskUrl - URL to view the task
 */
async function sendTaskAssignmentEmail(options) {
  const transport = createTransporter();

  if (!transport) {
    console.log('Email service not configured, skipping email notification');
    return { sent: false, error: 'Email service not configured' };
  }

  const {
    to,
    assignedByName,
    taskTitle,
    taskDescription,
    workspaceName,
    dueDate,
    priority,
    taskUrl
  } = options;

  // Create email HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .task-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .task-title { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
        .task-description { color: #6b7280; margin-bottom: 15px; }
        .meta { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; }
        .meta-item { display: flex; align-items: center; color: #6b7280; font-size: 14px; }
        .meta-label { font-weight: bold; margin-right: 5px; }
        .priority-high { color: #dc2626; }
        .priority-medium { color: #f59e0b; }
        .priority-low { color: #10b981; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .button:hover { background-color: #2563eb; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 New Task Assigned</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${assignedByName}</strong> has assigned you a new task in <strong>${workspaceName}</strong>.</p>

          <div class="task-info">
            <div class="task-title">${taskTitle}</div>
            ${taskDescription ? `<div class="task-description">${taskDescription}</div>` : ''}

            <div class="meta">
              ${workspaceName ? `
                <div class="meta-item">
                  <span class="meta-label">Workspace:</span>
                  <span>${workspaceName}</span>
                </div>
              ` : ''}
              ${dueDate ? `
                <div class="meta-item">
                  <span class="meta-label">Due Date:</span>
                  <span>${new Date(dueDate).toLocaleDateString()}</span>
                </div>
              ` : ''}
              ${priority ? `
                <div class="meta-item">
                  <span class="meta-label">Priority:</span>
                  <span class="priority-${priority.toLowerCase()}">${priority}</span>
                </div>
              ` : ''}
            </div>
          </div>

          ${taskUrl ? `
            <a href="${taskUrl}" class="button">View Task</a>
          ` : ''}

          <p style="margin-top: 30px; color: #6b7280;">
            You can view and manage this task in your workspace.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from AI Work.</p>
          <p>To manage your notification preferences, visit your account settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Task Assigned

${assignedByName} has assigned you a new task in ${workspaceName}.

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}
${workspaceName ? `Workspace: ${workspaceName}` : ''}
${dueDate ? `Due Date: ${new Date(dueDate).toLocaleDateString()}` : ''}
${priority ? `Priority: ${priority}` : ''}

${taskUrl ? `View task: ${taskUrl}` : ''}

---
This is an automated notification from AI Work.
  `.trim();

  const mailOptions = {
    from: `"AI Work" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `New Task: ${taskTitle}`,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('Task assignment email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending task assignment email:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send a generic notification email
 */
async function sendEmail({ to, subject, text, html }) {
  const transport = createTransporter();

  if (!transport) {
    console.log('Email service not configured, skipping email');
    return { sent: false, error: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"AI Work" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: html || text,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendTaskAssignmentEmail,
  sendEmail,
};
