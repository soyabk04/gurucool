import nodemailer from "nodemailer";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
// Create a transporter using SMTP
export const sendmail = async (
  subject: string,
  message: string,
  recipient: string,
  isHtml = false
) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { data, error } = await resend.emails.send({
      from: "Gurucool <noreply@soyab-dev.in>",
      to: [recipient],
      subject,
      ...(isHtml
        ? { html: message }
        : { text: message }),
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", data?.id);

    return data;
  } catch (error) {
    console.error("SEND MAIL ERROR:", error);
    throw error;
  }
};

  let template =
`<!DOCTYPE html>
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
  <td
    align="center"
    style="
      background:{{primaryColor}};
      padding:48px 40px;
      color:{{secondaryColor}};
    "
  >
    <h1 style="margin:0;font-size:34px;">
      {{organization}}
    </h1>

    <p
      style="
        margin-top:12px;
        color:{{secondaryColor}};
        opacity:.9;
      "
    >
      Learning Management Platform
    </p>
  </td>
</tr>

<!-- Body -->
<tr>
  <td style="padding:48px;background:#ffffff;">

    <h2 style="margin:0 0 20px;color:#1f2937;">
      Welcome, {{name}} 👋
    </h2>

    <p style="color:#4b5563;line-height:1.7;">
      Your account has been created for
      <strong>{{organization}}</strong>.
    </p>

    <!-- Account Card -->

    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="
        margin:30px 0;
        border:2px solid {{primaryColor}};
        border-radius:12px;
        padding:24px;
      "
    >
      <tr>
        <td>

          <p><strong>Organization:</strong> {{organization}}</p>
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Password:</strong> {{password}}</p>

        </td>
      </tr>
    </table>

    <!-- Button -->

    <div style="text-align:center;margin:40px 0;">

      <a
        href="{{domain}}"
        style="
          display:inline-block;
          background:{{primaryColor}};
          color:{{secondaryColor}};
          padding:16px 34px;
          text-decoration:none;
          border-radius:8px;
          font-weight:700;
        "
      >
        Login to GuruCool
      </a>

    </div>

    <!-- Notice -->

    <table
      width="100%"
      style="
        background:{{secondaryColor}};
        border-left:5px solid {{primaryColor}};
        padding:18px;
        border-radius:8px;
      "
    >
      <tr>
        <td style="color:#374151;">
          🔒 Please change your password after your first login.
        </td>
      </tr>
    </table>

  </td>
</tr>

<!-- Footer -->

<tr>
  <td
    align="center"
    style="
      background:{{primaryColor}};
      color:{{secondaryColor}};
      padding:24px;
      font-size:13px;
    "
  >
    © 2026 GuruCool. All rights reserved.
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
`;


export const sendWelcomeEmail=async (user:any,password:string,organization:any)=>{
  console.log(user,organization)
  const emailBody = template
  .replace(/{{name}}/g, user.name)
  .replace(/{{organization}}/g, organization.name)
  .replace(/{{email}}/g, user.email)
  .replace(/{{password}}/g, password)
  .replace(/{{domain}}/g, organization.domain)
  .replace(/{{primaryColor}}/g, organization.primaryColor || "#2563eb")
  .replace(/{{secondaryColor}}/g, organization.secondaryColor || "#ffffff");

  const subject=`Welcome to ${organization.name}!`;
  const message=emailBody;
  console.log(22)
  await sendmail(subject, message, user.email, true);
}

let forgetPasswordTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;"
        >
          <!-- Header -->
          <tr>
            <td
              align="center"
              style="background:#2563eb;padding:30px;color:#ffffff;"
            >
              <h1 style="margin:0;">GuruCool</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin-top:0;color:#111827;">
                Reset your password
              </h2>

              <p style="font-size:16px;color:#4b5563;line-height:1.6;">
                We received a request to reset the password for your account.
                Click the button below to choose a new password.
              </p>

              <table cellpadding="0" cellspacing="0" align="center" style="margin:35px auto;">
                <tr>
                  <td bgcolor="#2563eb" style="border-radius:8px;">
                    <a
                      href="{{resetLink}}"
                      target="_blank"
                      style="
                        display:inline-block;
                        padding:14px 32px;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:16px;
                        font-weight:bold;
                      "
                    >
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;color:#6b7280;">
                Or copy and paste this URL into your browser:
              </p>

              <p style="word-break:break-all;">
                <a href="{{resetLink}}" style="color:#2563eb;">
                  {{resetLink}}
                </a>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;" />

              <p style="font-size:14px;color:#6b7280;">
                <strong>This link expires in 15 minutes.</strong>
              </p>

              <p style="font-size:14px;color:#6b7280;">
                If you didn't request a password reset, you can safely ignore
                this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="background:#f9fafb;padding:20px;font-size:13px;color:#9ca3af;"
            >
              © 2026 GuruCool. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`


export const sendForgetPasswordEmail = async (
  user: any,
  resetLink: string
) => {

  const emailBody = forgetPasswordTemplate
    .replace(/{{resetLink}}/g, resetLink)
    .replace(/{{name}}/g, user.name)
    .replace(/{{email}}/g, user.email);

  const subject = "Reset Your Password";

  await sendmail(
    subject,
    emailBody,
    user.email,
    true
  );
};

export const sendChapterUnlockedEmail = async (
  user: {
    name: string;
    email: string;
  },
  chapter: {
    title: string;
    courseName: string;
  },
  domain: string
) => {
  const chapterLink =
    `https://${domain}/courses`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>

<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;"
        >

          <tr>
            <td
              align="center"
              style="background:#2563eb;padding:30px;color:#ffffff;"
            >
              <h1 style="margin:0;">GuruCool</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">

              <h2 style="margin-top:0;color:#111827;">
                A new chapter is unlocked 🎉
              </h2>

              <p style="font-size:16px;color:#4b5563;line-height:1.6;">
                Hi ${user.name},
              </p>

              <p style="font-size:16px;color:#4b5563;line-height:1.6;">
                A new chapter in your course is now available.
              </p>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  margin:25px 0;
                  border:1px solid #e5e7eb;
                  border-radius:10px;
                  padding:20px;
                "
              >
                <tr>
                  <td>

                    <p style="margin:0 0 8px;color:#6b7280;">
                      Course
                    </p>

                    <h3 style="margin:0 0 18px;color:#111827;">
                      ${chapter.courseName}
                    </h3>

                    <p style="margin:0;color:#6b7280;">
                      Chapter
                    </p>

                    <h3 style="margin:8px 0 0;color:#2563eb;">
                      ${chapter.title}
                    </h3>

                  </td>
                </tr>
              </table>

              <div style="text-align:center;margin:35px 0;">

                <a
                  href="${chapterLink}"
                  target="_blank"
                  style="
                    display:inline-block;
                    background:#2563eb;
                    color:#ffffff;
                    padding:14px 30px;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                  "
                >
                  Start Learning
                </a>

              </div>

              <p style="font-size:14px;color:#6b7280;">
                Log in to GuruCool to start learning the newly unlocked chapter.
              </p>

            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="
                background:#f9fafb;
                padding:20px;
                font-size:13px;
                color:#9ca3af;
              "
            >
              © 2026 GuruCool. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  await sendmail(
    `🎉 ${chapter.title} is now unlocked!`,
    html,
    user.email,
    true
  );
};