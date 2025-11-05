/**
 * Contact Matching Service
 * Finds or creates contacts for form submissions
 */

import { db } from '$lib/server/db';
import { contacts } from '$lib/db/drizzle/schema';
import { eq, and, or, sql } from 'drizzle-orm';

export interface DonorInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Find or create a contact from donor information
 */
export async function findOrCreateContact(
  workspaceId: string,
  donorInfo: DonorInfo
): Promise<string> {
  // Try to find existing contact by email
  if (donorInfo.email) {
    const emailMatch = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          sql`LOWER(${contacts.email}) = LOWER(${donorInfo.email})`
        )
      )
      .limit(1);

    if (emailMatch.length > 0) {
      return emailMatch[0].id;
    }
  }

  // Try to find by phone if provided
  if (donorInfo.phone) {
    const phoneMatch = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          eq(contacts.phone, donorInfo.phone)
        )
      )
      .limit(1);

    if (phoneMatch.length > 0) {
      return phoneMatch[0].id;
    }
  }

  // Try to find by name match (first + last)
  if (donorInfo.firstName && donorInfo.lastName) {
    const nameMatch = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          sql`LOWER(${contacts.firstName}) = LOWER(${donorInfo.firstName})`,
          sql`LOWER(${contacts.lastName}) = LOWER(${donorInfo.lastName})`
        )
      )
      .limit(1);

    if (nameMatch.length > 0) {
      return nameMatch[0].id;
    }
  }

  // No match found, create new contact
  const newContact = await db
    .insert(contacts)
    .values({
      workspaceId,
      firstName: donorInfo.firstName,
      lastName: donorInfo.lastName,
      email: donorInfo.email,
      phone: donorInfo.phone || null,
      address: donorInfo.address || null,
      city: donorInfo.city || null,
      state: donorInfo.state || null,
      zipCode: donorInfo.zipCode || null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  return newContact[0].id;
}

/**
 * Update contact information if new data is provided
 */
export async function updateContactIfNeeded(
  contactId: string,
  donorInfo: DonorInfo
): Promise<void> {
  const contact = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (contact.length === 0) {
    return;
  }

  const existing = contact[0];
  const updates: any = {};

  // Update fields if they have new data and existing is empty
  if (!existing.phone && donorInfo.phone) {
    updates.phone = donorInfo.phone;
  }
  if (!existing.address && donorInfo.address) {
    updates.address = donorInfo.address;
  }
  if (!existing.city && donorInfo.city) {
    updates.city = donorInfo.city;
  }
  if (!existing.state && donorInfo.state) {
    updates.state = donorInfo.state;
  }
  if (!existing.zipCode && donorInfo.zipCode) {
    updates.zipCode = donorInfo.zipCode;
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();

    await db
      .update(contacts)
      .set(updates)
      .where(eq(contacts.id, contactId));
  }
}
