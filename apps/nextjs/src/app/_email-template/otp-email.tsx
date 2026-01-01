import { Container, Heading, Text } from "@react-email/components";

export default function OTPEmail({ name, otp }: { name: string; otp: string }) {
  return (
    <Container>
      <Heading>Hello {name}</Heading>
      <Text>Your verification code is:</Text>

      <Text style={{ fontSize: "32px", fontWeight: "bold" }}>{otp}</Text>

      <Text>This code will expire in 10 minutes.</Text>
    </Container>
  );
}
