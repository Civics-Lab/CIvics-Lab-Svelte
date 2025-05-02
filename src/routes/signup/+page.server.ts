import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { db } from '$lib/server/db';
import { getInviteByToken } from '$lib/server/invites';

export const load: PageServerLoad = async ({ locals, url }) => {
  // if the user is already logged in redirect them
  if (locals.user) {
    redirect(303, '/app')
  }

  // Check for invite token
  const inviteToken = url.searchParams.get('invite');
  
  if (inviteToken) {
    try {
      // Look up the invite using our utility function
      const invite = await getInviteByToken(inviteToken);
      
      if (!invite) {
        return {
          error: "Invalid invitation link"
        };
      }
      
      // Check if expired
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return {
          error: "This invitation has expired"
        };
      }
      
      // Check if already accepted
      if (invite.status !== 'Pending') {
        return {
          error: "This invitation has already been used"
        };
      }
      
      return {
        invite: {
          id: invite.id,
          email: invite.email,
          token: inviteToken
        }
      };
    } catch (error) {
      console.error('Error fetching invite:', error);
      return {
        error: "Failed to load invitation details"
      };
    }
  }

  return {}
}
