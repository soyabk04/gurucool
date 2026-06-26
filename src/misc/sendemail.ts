import nodemailer from "nodemailer";
// Create a transporter using SMTP
export const sendmail=async (subject:string, message:string,recipient:string)=>{
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL (upgrade connection to SSL after connecting)
  auth: {
    user: process.env.GMAILID ,
    pass: process.env.GMAILPASS,
  },
});

try {
  const info = await transporter.sendMail({
    from: '"gurucool Team" <team@example.com>', // sender address
    to: recipient, // list of recipients
    subject: subject, // subject line
    text: message, // plain text body
    html: `<b>${message}</b>`, // HTML body
  });

  console.log("Message sent: %s", info.messageId);
  // Preview URL is only available when using an Ethereal test account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
} catch (err) {
  console.error("Error while sending mail:", err);
}
}

export const sendWelcomeEmail=async (user:any,password:string,organization:string)=>{
  
  let template =
`html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background:#f4f7fc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td align="center"
              style="background:#2563eb;padding:30px;color:white;">
              <h1 style="margin:0;font-size:32px;">
                Gurucool
              </h1>
              <p style="margin-top:10px;font-size:16px;">
                Welcome to your learning journey
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1f2937;">
                Hello {{name}},
              </h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                Welcome to <strong>Gurucool</strong>. Your account has been
                created by <strong>{{organization}}</strong>.
              </p>

              <table width="100%"
                style="background:#f8fafc;border-radius:8px;padding:20px;margin:25px 0;">
                <tr>
                  <td>
                    <p><strong>Organization:</strong> {{organization}}</p>
                    <p><strong>Email:</strong> {{email}}</p>
                    <p><strong>Password:</strong> {{password}}</p>
                  </td>
                </tr>
              </table>

              <p style="color:#4b5563;font-size:15px;">
                For security reasons, please change your password after your first login.
              </p>

              <div style="text-align:center;margin:35px 0;">
                <a href="https://gurucool.com/login"
                  style="background:#2563eb;color:white;
                  padding:14px 28px;
                  text-decoration:none;
                  border-radius:6px;
                  display:inline-block;
                  font-weight:bold;">
                  Login to Gurucool
                </a>
              </div>

              <p style="color:#6b7280;font-size:14px;">
                If you have any questions, please contact your administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background:#f8fafc;padding:20px;color:#6b7280;font-size:13px;">
              © 2026 Gurucool. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

 ;

  const emailBody = template
  .replace("{{name}}", user.name)
  .replace("{{email}}", user.email)
  .replace("{{password}}", password)
  .replace("{{organization}}", organization);

  const subject="Welcome to Gurucool!";
  const message=emailBody;

  await sendmail(subject, message, user.email);
}