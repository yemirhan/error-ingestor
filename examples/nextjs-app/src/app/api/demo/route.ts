import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shouldError = searchParams.get("error") === "true";

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (shouldError) {
    // Return an error response
    return NextResponse.json(
      {
        success: false,
        error: "Simulated server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  // Return success response
  return NextResponse.json({
    success: true,
    message: "API call successful!",
    timestamp: new Date().toISOString(),
    data: {
      id: Math.random().toString(36).slice(2),
      name: "Demo Data",
    },
  });
}
