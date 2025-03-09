// src/routes/api/invite-user/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Verify the user is authenticated
    const { session } = await locals.safeGetSession();
    if (!session) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { email, workspaceId, role } = await request.json();
    
    if (!email || !workspaceId || !role) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Without service role key, we'll use a simplified approach:
    // 1. Create a record in a pending_invitations table 
    // 2. In a real app, this would trigger an email with a signup link

    // For the demo, we'll just create a user_workspaces entry directly
    // This simulates a successful invitation acceptance
    const { data: existingUser, error: queryError } = await locals.supabase
      .from('user_workspaces')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.user.id);
    
    if (queryError) {
      return json({ error: queryError.message }, { status: 500 });
    }
    
    // Generate a simulated user ID
    const mockUserId = crypto.randomUUID();
    
    // Create a user_workspace entry
    const { error: insertError } = await locals.supabase
      .from('user_workspaces')
      .insert({
        user_id: mockUserId,
        workspace_id: workspaceId,
        role: role
      });
    
    if (insertError) {
      return json({ error: insertError.message }, { status: 500 });
    }
    
    return json({ 
      success: true, 
      message: 'Invitation sent',
      user: {
        id: mockUserId,
        email: email
      }
    });
  } catch (err) {
    console.error('Server error:', err);
    return json({ 
      error: 'Failed to process invitation' 
    }, { status: 500 });
  }
};