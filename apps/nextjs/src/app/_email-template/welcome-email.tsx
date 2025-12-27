import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { Text } from "@react-email/text";

import { env } from "~/env";

interface WelcomeEmailProps {
  name: string;
  pass: string;
  email: string;
}

export default function WelcomeEmail({ name, pass, email }: WelcomeEmailProps) {
  const baseUrl =
    env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : env.NEXT_PUBLIC_APP_URL;
  return (
    <Html>
      <Head />
      <Container style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <Img
          src={`${baseUrl}/joc-logo-color.png`}
          alt="JOC Logo"
          width="120"
          style={{ marginBottom: "20px" }}
        />
        <Heading as="h2">Hi {name}, Welcome to JOC Analytics!</Heading>
        <Text>
          We're excited to have you onboard. You can now explore insights,
          reports, and business intelligence tailored for your team.
        </Text>

        {/* Credentials Section */}
        <Container
          style={{
            backgroundColor: "#F3F4F6",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "20px",
            margin: "24px 0",
            maxWidth: "350px",
          }}
        >
          <Heading
            as="h4"
            style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#1D4ED8" }}
          >
            Your Login Credentials
          </Heading>
          <Text style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
            <strong>Email:</strong> {email}
          </Text>
          <Text style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
            <strong>Password:</strong> {pass}
          </Text>
        </Container>
        <Text style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>
          For your security, please change your password after your first login.
        </Text>
        {/* End Credentials Section */}

        <Button
          href={`${baseUrl}/login`}
          style={{
            backgroundColor: "#1D4ED8",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "6px",
            textDecoration: "none",
            display: "inline-block",
            marginTop: "20px",
          }}
        >
          Go to SignIn
        </Button>

        <Text style={{ marginTop: "40px", fontSize: "12px", color: "#888" }}>
          — The JOC Analytics Team <br />
          Need help? Contact us at support@jocanalytics.com
        </Text>
      </Container>
    </Html>
  );
}
