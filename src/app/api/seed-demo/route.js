import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Get the admin user (you)
    const admin = await User.findOne({ clerkId: userId });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Check if demo data already exists
    const existingClients = await User.countDocuments({ role: "client" });
    if (existingClients > 0) {
      return NextResponse.json({ 
        warning: "Demo data already exists. Delete existing clients first if you want fresh data." 
      });
    }

    // Create fake clients
    const clients = await User.insertMany([
      {
        clerkId: "demo_client_1",
        email: "sarah@acme.com",
        name: "Acme Corporation",
        role: "client",
        company: "Acme Inc.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clerkId: "demo_client_2",
        email: "mike@globex.com",
        name: "Globex Corporation",
        role: "client",
        company: "Globex International",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clerkId: "demo_client_3",
        email: "eliza@initech.com",
        name: "Initech LLC",
        role: "client",
        company: "Initech",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clerkId: "demo_client_4",
        email: "john@stark.com",
        name: "Stark Industries",
        role: "client",
        company: "Stark Enterprises",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clerkId: "demo_client_5",
        email: "peter@umbrella.com",
        name: "Umbrella Corp",
        role: "client",
        company: "Umbrella Corporation",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create projects for each client
    const projects = [];
    const projectTemplates = [
      { name: "Website Redesign", status: "in-progress", progress: 65 },
      { name: "Mobile App Development", status: "planning", progress: 15 },
      { name: "SEO Optimization", status: "completed", progress: 100 },
      { name: "Brand Identity Package", status: "review", progress: 90 },
      { name: "E-commerce Platform", status: "in-progress", progress: 45 },
      { name: "Marketing Campaign", status: "planning", progress: 10 },
      { name: "CRM Integration", status: "completed", progress: 100 },
      { name: "Social Media Management", status: "in-progress", progress: 80 }
    ];

    for (const client of clients) {
      // Each client gets 2-3 random projects
      const numProjects = Math.floor(Math.random() * 3) + 2; // 2-4 projects
      const shuffled = [...projectTemplates].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numProjects; i++) {
        const template = shuffled[i % shuffled.length];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
        
        const deadline = new Date(startDate);
        deadline.setMonth(deadline.getMonth() + Math.floor(Math.random() * 4) + 2);
        
        projects.push({
          name: `${client.name.split(' ')[0]} - ${template.name}`,
          description: `Comprehensive ${template.name.toLowerCase()} project for ${client.name}`,
          status: template.status,
          progress: template.progress,
          clientId: client._id,
          budget: Math.floor(Math.random() * 50000) + 10000,
          startDate: startDate,
          deadline: deadline,
          tasks: [
            { title: "Initial consultation", completed: true },
            { title: "Requirements gathering", completed: template.progress > 30 },
            { title: "Design phase", completed: template.progress > 60 },
            { title: "Development", completed: template.progress > 80 },
            { title: "Testing", completed: template.progress > 90 },
            { title: "Deployment", completed: template.progress === 100 }
          ],
          createdAt: startDate,
          updatedAt: new Date()
        });
      }
    }

    await Project.insertMany(projects);

    // Create invoices
    const invoices = [];
    const statuses = ["draft", "sent", "paid", "overdue"];
    
    for (const client of clients) {
      const numInvoices = Math.floor(Math.random() * 4) + 2; // 2-5 invoices
      
      for (let i = 0; i < numInvoices; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = Math.floor(Math.random() * 15000) + 2000;
        const issuedDate = new Date();
        issuedDate.setMonth(issuedDate.getMonth() - Math.floor(Math.random() * 3));
        
        const dueDate = new Date(issuedDate);
        dueDate.setDate(dueDate.getDate() + 30);
        
        invoices.push({
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${i}`,
          clientId: client._id,
          amount: amount,
          status: status,
          dueDate: dueDate,
          issuedDate: issuedDate,
          items: [
            {
              description: "Professional Services",
              quantity: Math.floor(Math.random() * 40) + 10,
              rate: 150,
              amount: amount * 0.6
            },
            {
              description: "Project Management",
              quantity: Math.floor(Math.random() * 20) + 5,
              rate: 200,
              amount: amount * 0.4
            }
          ],
          notes: `Invoice for ${client.name} services`,
          paidAt: status === "paid" ? new Date() : null,
          createdAt: issuedDate
        });
      }
    }

    await Invoice.insertMany(invoices);

    return NextResponse.json({
      success: true,
      message: "✅ Demo data created successfully!",
      stats: {
        clients: clients.length,
        projects: projects.length,
        invoices: invoices.length
      }
    });

  } catch (error) {
    console.error("Error seeding demo data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Delete all demo data (keep the admin user)
    await User.deleteMany({ role: "client" });
    await Project.deleteMany({});
    await Invoice.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "✅ All demo data deleted successfully!"
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}