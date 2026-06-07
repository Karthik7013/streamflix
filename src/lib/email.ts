import nodemailer from "nodemailer";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: requireEnv("EMAIL"),
      pass: requireEnv("APP_PASSWORD"),
    },
  });
}

export async function sendEmail(options: { to: string; subject: string; html: string }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: requireEnv("EMAIL"),
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
