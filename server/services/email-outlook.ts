import { Client } from '@microsoft/microsoft-graph-client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Outlook not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function sendPayslipEmailViaOutlook(
  toEmail: string,
  employeeName: string,
  periodMonth: number,
  periodYear: number,
  pdfBuffer: Buffer
): Promise<void> {
  try {
    console.log('[Email Service Outlook] Starting email send to:', toEmail);
    const client = await getUncachableOutlookClient();

    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    const periodText = `${monthNames[periodMonth - 1]} ${periodYear}`;
    const filename = `Lohnabrechnung_${periodYear}_${periodMonth.toString().padStart(2, '0')}_${employeeName.replace(/\s+/g, '_')}.pdf`;

    const message = {
      subject: `Lohnabrechnung ${periodText}`,
      body: {
        contentType: 'HTML',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Lohnabrechnung</h2>
            <p>Guten Tag ${employeeName},</p>
            <p>Anbei erhalten Sie Ihre Lohnabrechnung für den Monat <strong>${periodText}</strong>.</p>
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
            <br>
            <p>Freundliche Grüsse<br>Ihr Payroll Team</p>
          </div>
        `
      },
      toRecipients: [
        {
          emailAddress: {
            address: toEmail
          }
        }
      ],
      attachments: [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: filename,
          contentType: 'application/pdf',
          contentBytes: pdfBuffer.toString('base64')
        }
      ]
    };

    await client.api('/me/sendMail').post({
      message,
      saveToSentItems: true
    });

    console.log('[Email Service Outlook] Email sent successfully to:', toEmail);
  } catch (error: any) {
    console.error('[Email Service Outlook] Error sending email:', error);
    throw error;
  }
}
