import type { SentMessageInfo, Transporter } from "nodemailer";
import React from "react";
import { render } from "@react-email/render";
import nodemailerImport from "nodemailer";

import WelcomeEmail from "~/app/_email-template/welcome-email";
import { env } from "../../../../env";

const nodemailer = nodemailerImport;

interface RequestBody {
  to: string;
  name: string;
  pass: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as unknown;
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { to?: unknown }).to !== "string"
  ) {
    return Response.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
  const { to, name, pass } = body as RequestBody;

  const html = await render(
    React.createElement(WelcomeEmail, { name, pass, email: to }),
  );

  const transporter: Transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const info: SentMessageInfo = await transporter.sendMail({
      from: `"JOC Analytics" <${env.SMTP_FROM}>`,
      to,
      subject: "Welcome to JOC Analytics!",
      html,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return Response.json({ success: true, info });
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    return Response.json({ success: false, error: message });
  }
}
