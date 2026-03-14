import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const clients = await User.find({ role: "client" });
    
    // Format the data to see what's happening
    const clientInfo = clients.map(c => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      clerkId: c.clerkId
    }));

    return NextResponse.json({
      totalClients: clients.length,
      clients: clientInfo
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}