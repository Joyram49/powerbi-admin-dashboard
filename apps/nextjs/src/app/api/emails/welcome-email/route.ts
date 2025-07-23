import type { SentMessageInfo, Transporter } from "nodemailer";
import React from "react";
import { render } from "@react-email/render";
import nodemailerImport from "nodemailer";

import WelcomeEmail from "~/app/_email-template/welcome-email";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const transporter: Transporter = nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: {
      user: "AKIAQWBSQRSADFJMUPY5",
      pass: "BCM6Dx8jWBGr4+uBUm5ght86C0ZVBtXLaqbv+UBRGb7f",
    },
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const info: SentMessageInfo = await transporter.sendMail({
      from: '"JOC Analytics" <example@jocanalytics.com>',
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
