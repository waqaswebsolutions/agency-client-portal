import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";

// GET single project
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    await dbConnect();
    
    const currentUser = await User.findOne({ clerkId: userId });
    
    const project = await Project.findById(id).populate("clientId");
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access
    if (currentUser.role !== "admin" && project.clientId?.toString() !== currentUser._id?.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE project
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
    
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { 
        ...body, 
        updatedAt: new Date() 
      },
      { new: true }
    ).populate("clientId");
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error in PUT /api/projects/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE project
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
    
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await Project.findByIdAndDelete(id);
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/projects/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}