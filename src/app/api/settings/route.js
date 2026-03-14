import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Setting from "@/models/Setting";

// GET user settings
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find or create settings
    let settings = await Setting.findOne({ userId: user._id });
    
    if (!settings) {
      // Create default settings
      settings = await Setting.create({
        userId: user._id,
        companyName: user.company || "",
        invoicePrefix: "INV",
        emailNotifications: true,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error in GET /api/settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE settings
export async function PUT(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    await dbConnect();
    
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update settings
    const settings = await Setting.findOneAndUpdate(
      { userId: user._id },
      { 
        ...body, 
        updatedAt: new Date() 
      },
      { new: true, upsert: true } // upsert creates if doesn't exist
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error in PUT /api/settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}