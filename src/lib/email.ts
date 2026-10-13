import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { logger } from "@/lib/logger";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: requireEnv("EMAIL"),
        pass: requireEnv("APP_PASSWORD"),
      },
    });
  }
  return cachedTransporter;
}

export async function sendEmail(options: { to: string; subject: string; html: string }) {
  try {
    await getTransporter().sendMail({
      from: requireEnv("EMAIL"),
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (err) {
    logger.error("email", "Failed to send email", err);
    throw new Error("Failed to send email");
  }
}
