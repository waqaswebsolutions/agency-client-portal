import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";

// GET single client
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    await dbConnect();
    
    const client = await User.findById(id);
    
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error in GET /api/clients/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE client with email validation
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    
    await dbConnect();
    
    const currentUser = await User.findOne({ clerkId: userId });
    
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if email already exists on another client
    if (body.email) {
      const existingUser = await User.findOne({ 
        email: body.email.toLowerCase(),
        _id: { $ne: id } // Exclude current client
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: "Email already exists. Please use a different email address." 
        }, { status: 400 });
      }
    }

    const client = await User.findByIdAndUpdate(
      id,
      { 
        ...body, 
        email: body.email?.toLowerCase(), // Store email in lowercase
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    // Handle duplicate key error from MongoDB
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Email already exists. Please use a different email address." 
      }, { status: 400 });
    }
    
    console.error("Error in PUT /api/clients/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE client
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    await dbConnect();
    
    const currentUser = await User.findOne({ clerkId: userId });
    
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if client has any projects or invoices
    const projectsCount = await Project.countDocuments({ clientId: id });
    const invoicesCount = await Invoice.countDocuments({ clientId: id });
    
    if (projectsCount > 0 || invoicesCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete client with existing projects or invoices. Please delete them first." 
      }, { status: 400 });
    }

    const client = await User.findByIdAndDelete(id);
    
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/clients/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}