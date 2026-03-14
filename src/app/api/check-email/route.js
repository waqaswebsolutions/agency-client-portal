import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const excludeId = searchParams.get("excludeId");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();
    
    // Build query
    const query = { email: email.toLowerCase() }; // Store emails in lowercase for consistency
    if (excludeId) {
      query._id = { $ne: excludeId }; // Exclude current user when editing
    }

    const existingUser = await User.findOne(query);
    
    return NextResponse.json({ 
      exists: !!existingUser,
      message: existingUser ? "Email already exists" : "Email is available"
    });
  } catch (error) {
    console.error("Error in check-email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}