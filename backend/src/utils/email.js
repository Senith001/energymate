import nodemailer from "nodemailer";

const requireEnv = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

export const sendEmail = async ({ to, subject, html }) => {
  // Validate required env vars (helps you immediately)
  const host = requireEnv("EMAIL_HOST");
  const port = Number(requireEnv("EMAIL_PORT"));
  const user = requireEnv("EMAIL_USER");
  const pass = requireEnv("EMAIL_PASS");
  const from = requireEnv("EMAIL_FROM");

  const secure =
    process.env.EMAIL_SECURE === "true" || port === 465; // auto-secure for 465

  // Use the native Gmail service mapping to avoid IPv6/port timeout issues on cloud hosts
  const transporter = nodemailer.createTransport(
    host.includes("gmail.com")
      ? {
          service: "gmail",
          auth: { user, pass },
        }
      : {
          host,
          port,
          secure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false
          }
        }
  );

  // checks SMTP connection
  await transporter.verify();

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  // Helpful for debugging in terminal
  console.log("✅ Email sent:", {
    to,
    subject,
    messageId: info.messageId,
  });

  return info;
};