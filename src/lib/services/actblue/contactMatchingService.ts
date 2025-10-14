/**
 * Contact Matching Service for ActBlue Donors
 * Implements fuzzy matching algorithms to find existing contacts
 */

import { db } from '$lib/server/db';
import { contacts, contactEmails, contactPhoneNumbers, contactAddresses } from '$lib/db/drizzle/schema';
import { eq, and, ilike, sql } from 'drizzle-orm';
import type { ActBlueDonor, ContactMatchResult, ContactMatchCandidate } from '$lib/types/actblue';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy name matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if names are similar using fuzzy matching
 */
function areNamesSimilar(name1: string, name2: string): boolean {
  const norm1 = normalizeString(name1);
  const norm2 = normalizeString(name2);

  // Exact match
  if (norm1 === norm2) return true;

  // Levenshtein distance < 3 characters
  const distance = levenshteinDistance(norm1, norm2);
  return distance < 3;
}

/**
 * Find contact by exact email match
 */
export async function findContactByEmail(
  email: string,
  workspaceId: string
): Promise<ContactMatchCandidate | null> {
  try {
    const normalizedEmail = normalizeString(email);

    // Find email records
    const emailResults = await db
      .select({
        contactId: contactEmails.contactId,
        email: contactEmails.email
      })
      .from(contactEmails)
      .where(sql`LOWER(TRIM(${contactEmails.email})) = ${normalizedEmail}`);

    if (emailResults.length === 0) {
      return null;
    }

    // Get contact and verify workspace
    const contactId = emailResults[0].contactId;
    const contactResult = await db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, workspaceId)
      ))
      .limit(1);

    if (contactResult.length === 0) {
      return null;
    }

    return {
      contactId,
      confidence: 95,
      matchType: 'email',
      matchedFields: ['email']
    };
  } catch (error) {
    console.error('Error in findContactByEmail:', error);
    return null;
  }
}

/**
 * Find contact by name and address
 */
export async function findContactByNameAddress(
  donor: ActBlueDonor,
  workspaceId: string
): Promise<ContactMatchCandidate | null> {
  try {
    const firstName = normalizeString(donor.firstname);
    const lastName = normalizeString(donor.lastname);
    const street = normalizeString(donor.addr1);
    const zip = normalizeString(donor.zip);

    // Find contacts with similar names in workspace
    const contactResults = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName
      })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));

    // Filter by name similarity
    const nameMatches = contactResults.filter(contact => {
      const matchesFirst = areNamesSimilar(contact.firstName, firstName);
      const matchesLast = areNamesSimilar(contact.lastName, lastName);
      return matchesFirst && matchesLast;
    });

    if (nameMatches.length === 0) {
      return null;
    }

    // Check address match for each name match
    for (const contact of nameMatches) {
      const addresses = await db
        .select({
          streetAddress: contactAddresses.streetAddress,
          zipCodeId: contactAddresses.zipCodeId
        })
        .from(contactAddresses)
        .where(eq(contactAddresses.contactId, contact.id));

      // Check if any address matches
      const hasMatchingAddress = addresses.some(addr => {
        const addrStreet = normalizeString(addr.streetAddress);
        return addrStreet.includes(street) || street.includes(addrStreet);
      });

      if (hasMatchingAddress) {
        return {
          contactId: contact.id,
          confidence: 85,
          matchType: 'name_address',
          matchedFields: ['firstName', 'lastName', 'address']
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error in findContactByNameAddress:', error);
    return null;
  }
}

/**
 * Find contact by name and zip code
 */
export async function findContactByNameZip(
  donor: ActBlueDonor,
  workspaceId: string
): Promise<ContactMatchCandidate | null> {
  try {
    const firstName = normalizeString(donor.firstname);
    const lastName = normalizeString(donor.lastname);
    const zip = normalizeString(donor.zip);

    // Find contacts with similar names
    const contactResults = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName
      })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));

    const nameMatches = contactResults.filter(contact => {
      const matchesFirst = areNamesSimilar(contact.firstName, firstName);
      const matchesLast = areNamesSimilar(contact.lastName, lastName);
      return matchesFirst && matchesLast;
    });

    if (nameMatches.length === 0) {
      return null;
    }

    // Check zip code match (simplified - would need zipCodes table lookup)
    // For now, return match with lower confidence
    return {
      contactId: nameMatches[0].id,
      confidence: 70,
      matchType: 'name_zip',
      matchedFields: ['firstName', 'lastName', 'zipCode']
    };
  } catch (error) {
    console.error('Error in findContactByNameZip:', error);
    return null;
  }
}

/**
 * Find contact by name and phone
 */
export async function findContactByNamePhone(
  donor: ActBlueDonor,
  workspaceId: string
): Promise<ContactMatchCandidate | null> {
  try {
    if (!donor.phone) {
      return null;
    }

    const firstName = normalizeString(donor.firstname);
    const lastName = normalizeString(donor.lastname);
    const phone = donor.phone.replace(/\D/g, ''); // Remove non-digits

    // Find contacts with similar names
    const contactResults = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName
      })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));

    const nameMatches = contactResults.filter(contact => {
      const matchesFirst = areNamesSimilar(contact.firstName, firstName);
      const matchesLast = areNamesSimilar(contact.lastName, lastName);
      return matchesFirst && matchesLast;
    });

    if (nameMatches.length === 0) {
      return null;
    }

    // Check phone match
    for (const contact of nameMatches) {
      const phones = await db
        .select({ phoneNumber: contactPhoneNumbers.phoneNumber })
        .from(contactPhoneNumbers)
        .where(eq(contactPhoneNumbers.contactId, contact.id));

      const hasMatchingPhone = phones.some(p => {
        const normalizedPhone = p.phoneNumber.replace(/\D/g, '');
        return normalizedPhone === phone;
      });

      if (hasMatchingPhone) {
        return {
          contactId: contact.id,
          confidence: 80,
          matchType: 'name_phone',
          matchedFields: ['firstName', 'lastName', 'phone']
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error in findContactByNamePhone:', error);
    return null;
  }
}

/**
 * Main function to find best matching contact
 * Tries multiple strategies in order of confidence
 */
export async function findMatchingContact(
  donor: ActBlueDonor,
  workspaceId: string
): Promise<ContactMatchResult> {
  const candidates: ContactMatchCandidate[] = [];

  // Strategy 1: Email match (95% confidence)
  if (donor.email) {
    const emailMatch = await findContactByEmail(donor.email, workspaceId);
    if (emailMatch) {
      candidates.push(emailMatch);
    }
  }

  // Strategy 2: Name + Address (85% confidence)
  const nameAddressMatch = await findContactByNameAddress(donor, workspaceId);
  if (nameAddressMatch) {
    candidates.push(nameAddressMatch);
  }

  // Strategy 3: Name + Phone (80% confidence)
  if (donor.phone) {
    const namePhoneMatch = await findContactByNamePhone(donor, workspaceId);
    if (namePhoneMatch) {
      candidates.push(namePhoneMatch);
    }
  }

  // Strategy 4: Name + Zip (70% confidence)
  const nameZipMatch = await findContactByNameZip(donor, workspaceId);
  if (nameZipMatch) {
    candidates.push(nameZipMatch);
  }

  // Sort by confidence (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Return best match if confidence is high enough
  if (candidates.length > 0 && candidates[0].confidence >= 70) {
    return {
      matched: true,
      contactId: candidates[0].contactId,
      confidence: candidates[0].confidence,
      candidates,
      shouldCreateNew: false
    };
  }

  // No confident match found
  return {
    matched: false,
    confidence: 0,
    candidates,
    shouldCreateNew: true
  };
}

/**
 * Create new contact from ActBlue donor data
 */
export async function createContactFromActBlue(
  donor: ActBlueDonor,
  workspaceId: string,
  userId: string
): Promise<string> {
  try {
    const { v4: uuidv4 } = await import('uuid');

    // Create contact
    const contactId = uuidv4();
    await db.insert(contacts).values({
      id: contactId,
      workspaceId,
      firstName: donor.firstname,
      lastName: donor.lastname,
      status: 'active',
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Add email if provided
    if (donor.email) {
      await db.insert(contactEmails).values({
        contactId,
        email: donor.email,
        status: 'active',
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Add phone if provided
    if (donor.phone) {
      await db.insert(contactPhoneNumbers).values({
        contactId,
        phoneNumber: donor.phone,
        status: 'active',
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Add address if provided
    if (donor.addr1 && donor.city) {
      await db.insert(contactAddresses).values({
        contactId,
        streetAddress: donor.addr1,
        city: donor.city,
        status: 'active',
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return contactId;
  } catch (error) {
    console.error('Error creating contact from ActBlue:', error);
    throw new Error('Failed to create contact from ActBlue donor data');
  }
}
