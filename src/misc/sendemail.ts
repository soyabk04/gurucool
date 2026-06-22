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
  
  let template =`
Hi {{name}},

Welcome to Gurucool! Your account has been successfully created by {{organization}}.

Here are your login credentials:

Organization: {{organization}}
Email: {{email}}
Password: {{password}}

You can use these credentials to log in to your Gurucool account and start accessing your courses and learning materials.

For security reasons, we recommend changing your password after your first login.

If you have any questions or need assistance, please contact your organization administrator.

Happy learning!

Best regards,
The Gurucool Team
` ;

  const emailBody = template
  .replace("{{name}}", user.name)
  .replace("{{email}}", user.email)
  .replace("{{password}}", password)
  .replace("{{organization}}", organization);

  const subject="Welcome to Gurucool!";
  const message=emailBody;

  await sendmail(subject, message, user.email);
}