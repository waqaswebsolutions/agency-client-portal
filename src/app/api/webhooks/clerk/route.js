import { Webhook } from 'svix';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  // Get the headers
  const headerPayload = headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix Webhook instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  // Verify the webhook signature
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Invalid webhook signature', { status: 400 });
  }

  // Connect to database
  await dbConnect();

  const eventType = evt.type;
  const { id, ...attributes } = evt.data;

  // Handle different event types
  try {
    if (eventType === 'user.created') {
      console.log(`Webhook received: user.created for ID: ${id}`);
      
      const email = attributes.email_addresses?.[0]?.email_address;
      const firstName = attributes.first_name || '';
      const lastName = attributes.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || email || 'User';
      
      // Check if user already exists
      let user = await User.findOne({ clerkId: id });
      
      if (!user) {
        // Create new user
        user = await User.create({
          clerkId: id,
          email: email,
          name: name,
          role: 'client', // Default role
          avatar: attributes.image_url,
        });
        console.log(`✅ User created in MongoDB: ${email}`);
      } else {
        console.log(`User already exists: ${email}`);
      }
    }
    
    else if (eventType === 'user.updated') {
      console.log(`Webhook received: user.updated for ID: ${id}`);
      
      const email = attributes.email_addresses?.[0]?.email_address;
      const firstName = attributes.first_name || '';
      const lastName = attributes.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || email;
      
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email,
          name: name,
          avatar: attributes.image_url,
        }
      );
      console.log(`✅ User updated in MongoDB: ${email}`);
    }
    
    else if (eventType === 'user.deleted') {
      console.log(`Webhook received: user.deleted for ID: ${id}`);
      await User.findOneAndDelete({ clerkId: id });
      console.log(`✅ User deleted from MongoDB: ${id}`);
    }

    return new Response('Webhook processed successfully', { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}