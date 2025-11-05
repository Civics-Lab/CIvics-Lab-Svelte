/**
 * Donor Invite Service
 * Manages donor portal invitations
 */

import { db } from '$lib/server/db';
import { donorPortalInvites, users } from '$lib/db/drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { DonorPortalInvite, CreateDonorInviteData } from '$lib/types/donorPortal';
import crypto from 'crypto';

/**
 * Generate a unique invite token
 */
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a donor portal invite
 */
export async function createInvite(data: CreateDonorInviteData): Promise<DonorPortalInvite> {
  const inviteToken = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

  const result = await db
    .insert(donorPortalInvites)
    .values({
      ...data,
      inviteToken,
      expiresAt,
      createdAt: new Date()
    })
    .returning();

  return result[0] as DonorPortalInvite;
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token: string): Promise<DonorPortalInvite | null> {
  const result = await db
    .select()
    .from(donorPortalInvites)
    .where(
      and(
        eq(donorPortalInvites.inviteToken, token),
        gt(donorPortalInvites.expiresAt, new Date())
      )
    )
    .limit(1);

  return result.length > 0 ? (result[0] as DonorPortalInvite) : null;
}

/**
 * Get invite by contact ID
 */
export async function getInviteByContact(
  contactId: string,
  workspaceId: string
): Promise<DonorPortalInvite | null> {
  const result = await db
    .select()
    .from(donorPortalInvites)
    .where(
      and(
        eq(donorPortalInvites.contactId, contactId),
        eq(donorPortalInvites.workspaceId, workspaceId)
      )
    )
    .limit(1);

  return result.length > 0 ? (result[0] as DonorPortalInvite) : null;
}

/**
 * Accept an invite (mark as accepted)
 */
export async function acceptInvite(token: string, userId: string): Promise<void> {
  const invite = await getInviteByToken(token);

  if (!invite) {
    throw new Error('Invalid or expired invite token');
  }

  // Mark invite as accepted
  await db
    .update(donorPortalInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(donorPortalInvites.inviteToken, token));

  // Grant donor portal access to user
  await db
    .update(users)
    .set({ canAccessDonorPortal: true })
    .where(eq(users.id, userId));
}

/**
 * Check if contact has donor portal access
 */
export async function hasPortalAccess(
  contactId: string,
  workspaceId: string
): Promise<boolean> {
  const invite = await getInviteByContact(contactId, workspaceId);

  return invite !== null && invite.acceptedAt !== null;
}

/**
 * Resend invite (create new token)
 */
export async function resendInvite(
  contactId: string,
  workspaceId: string
): Promise<DonorPortalInvite> {
  // Check if invite already exists
  const existing = await getInviteByContact(contactId, workspaceId);

  if (existing && !existing.acceptedAt) {
    // Delete old invite
    await db
      .delete(donorPortalInvites)
      .where(eq(donorPortalInvites.id, existing.id));
  }

  // Create new invite
  return await createInvite({
    contactId,
    workspaceId,
    email: existing?.email || ''
  });
}

/**
 * Send invite email (to be implemented with email service)
 */
export async function sendInviteEmail(inviteId: string): Promise<void> {
  // TODO: Implement email sending
  // This will use the email service to send a formatted invite email
  console.log('Send invite email for:', inviteId);
}
