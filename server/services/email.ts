import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getApiKey() {
  const credentials = await getCredentials();
  return credentials.apiKey;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableResendClient() {
  const apiKey = await getApiKey();
  return {
    client: new Resend(apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export async function sendPayslipEmail(
  toEmail: string,
  employeeName: string,
  periodMonth: number,
  periodYear: number,
  pdfBuffer: Buffer
): Promise<void> {
  try {
    console.log('[Email Service] Starting email send to:', toEmail);
    const { client, fromEmail } = await getUncachableResendClient();
    console.log('[Email Service] Got Resend client, fromEmail:', fromEmail);

    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    const periodText = `${monthNames[periodMonth - 1]} ${periodYear}`;

    const result = await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Lohnabrechnung ${periodText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Lohnabrechnung</h2>
          <p>Guten Tag ${employeeName},</p>
          <p>Anbei erhalten Sie Ihre Lohnabrechnung für den Monat <strong>${periodText}</strong>.</p>
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <br>
          <p>Freundliche Grüsse<br>Ihr Payroll Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Lohnabrechnung_${periodYear}_${periodMonth.toString().padStart(2, '0')}_${employeeName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
        }
      ]
    });
    
    console.log('[Email Service] Resend response:', result);
    
    // Check if Resend returned an error
    if (result.error) {
      throw new Error(`Email sending failed: ${result.error.message || JSON.stringify(result.error)}`);
    }
    
    console.log('[Email Service] Email sent successfully, ID:', result.data?.id);
  } catch (error: any) {
    console.error('[Email Service] Error sending email:', error);
    throw error;
  }
}
