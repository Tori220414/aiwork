const { Resend } = require('resend');

/**
 * Email Service for sending notifications
 * Uses Resend API (HTTP-based, works on Railway)
 */

// Create Resend client
let resendClient = null;

function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === 'your-resend-api-key') {
    console.warn('⚠️  Resend API key not configured. Set RESEND_API_KEY in environment variables.');
    return null;
  }

  resendClient = new Resend(apiKey);
  console.log('✅ Resend email service initialized');

  return resendClient;
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
  console.log('📧 sendTaskAssignmentEmail called with recipient:', options.to);

  const resend = getResendClient();

  if (!resend) {
    console.log('⚠️  Email service not configured, skipping email notification');
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

  try {
    console.log('📤 Sending email via Resend API...');

    const { data, error } = await resend.emails.send({
      from: 'AI Work <onboarding@resend.dev>', // Use Resend's test domain
      to: [to],
      subject: `New Task: ${taskTitle}`,
      text: textContent,
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return { sent: false, error: error.message };
    }

    console.log('✅ Task assignment email sent successfully! Email ID:', data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending task assignment email:', error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Send a generic notification email
 */
async function sendEmail({ to, subject, text, html }) {
  const resend = getResendClient();

  if (!resend) {
    console.log('⚠️  Email service not configured, skipping email');
    return { sent: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'AI Work <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
      html: html || text,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return { sent: false, error: error.message };
    }

    console.log('✅ Email sent! Email ID:', data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendTaskAssignmentEmail,
  sendEmail,
};
