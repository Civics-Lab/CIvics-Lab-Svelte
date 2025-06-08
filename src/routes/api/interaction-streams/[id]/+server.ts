import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { interactionStreams, contacts, businesses } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    // Fetch specific interaction stream with related data
    const [stream] = await db
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
      .where(eq(interactionStreams.id, id));

    if (!stream) {
      return json({ error: 'Interaction stream not found' }, { status: 404 });
    }

    return json(stream);
  } catch (error) {
    console.error('Error fetching interaction stream:', error);
    return json({ error: 'Failed to fetch interaction stream' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const { id } = params;
    const data = await request.json();
    const user = locals.user;

    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const {
      interactionType,
      title,
      content,
      interactionDate,
      status,
      metadata
    } = data;

    // Update the interaction stream
    const [updatedStream] = await db
      .update(interactionStreams)
      .set({
        ...(interactionType && { interactionType }),
        ...(title && { title }),
        ...(content && { content }),
        ...(interactionDate && { interactionDate: new Date(interactionDate) }),
        ...(status && { status }),
        ...(metadata !== undefined && { metadata }),
        updatedAt: new Date(),
        updatedById: user.id,
      })
      .where(eq(interactionStreams.id, id))
      .returning();

    if (!updatedStream) {
      return json({ error: 'Interaction stream not found' }, { status: 404 });
    }

    return json(updatedStream);
  } catch (error) {
    console.error('Error updating interaction stream:', error);
    return json({ error: 'Failed to update interaction stream' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const { id } = params;
    const user = locals.user;

    console.log('DELETE /api/interaction-streams/[id] called with:', { id, userId: user?.id });

    if (!user) {
      console.log('DELETE request rejected: Unauthorized');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      console.log('DELETE request rejected: No ID provided');
      return json({ error: 'ID is required' }, { status: 400 });
    }

    console.log('Attempting to soft delete interaction stream with ID:', id);

    // Soft delete by setting status to 'deleted'
    const [deletedStream] = await db
      .update(interactionStreams)
      .set({
        status: 'deleted',
        updatedAt: new Date(),
        updatedById: user.id,
      })
      .where(eq(interactionStreams.id, id))
      .returning();

    console.log('Update query completed, result:', deletedStream);

    if (!deletedStream) {
      console.log('DELETE failed: Interaction stream not found');
      return json({ error: 'Interaction stream not found' }, { status: 404 });
    }

    console.log('DELETE successful for interaction stream:', id);
    return json({ message: 'Interaction stream deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/interaction-streams/[id]:', error);
    return json({ error: 'Failed to delete interaction stream' }, { status: 500 });
  }
};