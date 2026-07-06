interface EmailTemplateProps {
    title: string;
    header: string;
    body: string;
    buttonText: string;
    buttonUrl: string;
    footerText: string;
}

export function createEmailTemplate({
    title,
    header,
    body,
    buttonText,
    buttonUrl,
    footerText,
}: EmailTemplateProps): string {
    return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>

<body
  style="margin:0;padding:0;background-color:#040906;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color:#0a110d;border-radius:12px;padding:40px;text-align:center">
              <div style="width:28px;height:28px;margin:auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50" fill="#10b981" />
                  <path d="M38 28 L74 50 L38 72 Z" fill="#040906" />
                </svg>
              </div>
              <span
                style="font-size:20px;font-weight:700;color:#10b981;letter-spacing:-0.3px">StreamFlix</span>

              <h1 style="font-size:22px;font-weight:600;color:#f0f1f5;margin-top:28px">${header}</h1>
              <p style="font-size:15px;color:#9494b8;line-height:1.6;margin:0 0 32px">${body}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
                <tr>
                  <td style="background-color:#00cc73;border-radius:8px;padding:14px 36px;display:flex"><a href="${buttonUrl}"
                      style="color:#0f0f14;font-size:15px;font-weight:600;text-decoration:none;display:inline-block">${buttonText}</a></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding:24px 0 0">
              <p style="font-size:13px;color:#7171a0;margin:0 0 4px">${footerText}</p>
              <p style="font-size:12px;color:#4a4a6a;margin:0">StreamFlix · Bollywood Farm · India</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>

</html>`;
}