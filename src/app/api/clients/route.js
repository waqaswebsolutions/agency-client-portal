import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET all clients
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const currentUser = await User.findOne({ clerkId: userId });
    
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clients = await User.find({ role: "client" }).select("-clerkId");
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error in GET /api/clients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create a new client with email validation
export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    await dbConnect();
    
    const currentUser = await User.findOne({ clerkId: userId });
    
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email.toLowerCase() });
    
    if (existingUser) {
      return NextResponse.json({ 
        error: "Email already exists. Please use a different email address." 
      }, { status: 400 });
    }

    // Create new client
    const client = await User.create({
      ...body,
      email: body.email.toLowerCase(), // Store email in lowercase
      clerkId: `client_${Date.now()}`,
      role: "client",
    });
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    // Handle duplicate key error from MongoDB
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Email already exists. Please use a different email address." 
      }, { status: 400 });
    }
    
    console.error("Error in POST /api/clients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}