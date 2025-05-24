import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { FirstFaucetRequestDataScheme } from "~/utils/faucet";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const result = FirstFaucetRequestDataScheme.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error.message,
      },
      { status: 400 },
    );
  }

  console.log(result);

  const body = result.data;

  const captchaResult = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${env("RECAPTCHA_SECRET")}&response=${body.token}`,
    },
  );

  const verificationJson = await captchaResult.json();

  if (!verificationJson.success) {
    return NextResponse.json({
      error: "Invalid captcha token",

    }, { status: 403});
  }

  // TODO: send faucet extrinsic

  return NextResponse.json({}, { status: 200 });
}
