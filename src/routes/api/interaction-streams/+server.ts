import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { interactionStreams, contacts, businesses } from '$lib/db/drizzle/schema';
import { eq, and, desc, or } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const workspaceId = url.searchParams.get('workspace_id');
    const contactId = url.searchParams.get('contact_id');
    const businessId = url.searchParams.get('business_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!workspaceId) {
      return json({ error: 'workspace_id is required' }, { status: 400 });
    }

    // Build the query conditions
    let conditions = [eq(interactionStreams.workspaceId, workspaceId)];
    
    // Only fetch active interactions (not deleted)
    conditions.push(eq(interactionStreams.status, 'active'));
    
    if (contactId) {
      conditions.push(eq(interactionStreams.contactId, contactId));
    }
    
    if (businessId) {
      conditions.push(eq(interactionStreams.businessId, businessId));
    }

    // Fetch interaction streams with related contact and business data
    const streams = await db
      .select({
        id: interactionStreams.id,
        workspaceId: interactionStreams.workspaceId,
        contactId: interactionStreams.contactId,
        businessId: interactionStreams.businessId,
        interactionType: interactionStreams.interactionType,
        title: interactionStreams.title,
        content: interactionStreams.content,
        interactionDate: interactionStreams.interactionDate,
        status: interactionStreams.status,
        metadata: interactionStreams.metadata,
        createdAt: interactionStreams.createdAt,
        updatedAt: interactionStreams.updatedAt,
        createdById: interactionStreams.createdById,
        // Include contact info if available
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        // Include business info if available
        businessName: businesses.businessName,
      })
      .from(interactionStreams)
      .leftJoin(contacts, eq(interactionStreams.contactId, contacts.id))
      .leftJoin(businesses, eq(interactionStreams.businessId, businesses.id))
      .where(and(...conditions))
      .orderBy(desc(interactionStreams.interactionDate))
      .limit(limit)
      .offset(offset);

    return json(streams);
  } catch (error) {
    console.error('Error fetching interaction streams:', error);
    return json({ error: 'Failed to fetch interaction streams' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const user = locals.user;

    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      workspaceId,
      contactId,
      businessId,
      interactionType,
      title,
      content,
      interactionDate,
      metadata
    } = data;

    // Validate required fields
    if (!workspaceId || !interactionType || !title || !content) {
      return json({ 
        error: 'Missing required fields: workspaceId, interactionType, title, content' 
      }, { status: 400 });
    }

    // Validate that either contactId or businessId is provided
    if (!contactId && !businessId) {
      return json({ 
        error: 'Either contactId or businessId must be provided' 
      }, { status: 400 });
    }

    // Create the interaction stream
    const [newStream] = await db
      .insert(interactionStreams)
      .values({
        workspaceId,
        contactId: contactId || null,
        businessId: businessId || null,
        interactionType,
        title,
        content,
        interactionDate: interactionDate ? new Date(interactionDate) : new Date(),
        status: 'active',
        metadata: metadata || null,
        createdById: user.id,
        updatedById: user.id,
      })
      .returning();

    return json(newStream, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction stream:', error);
    return json({ error: 'Failed to create interaction stream' }, { status: 500 });
  }
};