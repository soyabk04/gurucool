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