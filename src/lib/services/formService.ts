/**
 * Form Service
 * Manages form CRUD operations
 */

import { db } from '$lib/server/db';
import { forms } from '$lib/db/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Form, CreateFormData, UpdateFormData } from '$lib/types/form';

/**
 * Generate a unique slug from a form name
 */
export async function generateUniqueSlug(
  name: string,
  workspaceId: string
): Promise<string> {
  // Create base slug from name
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if slug exists
  let counter = 0;
  let testSlug = slug;

  while (true) {
    const existing = await db
      .select()
      .from(forms)
      .where(eq(forms.slug, testSlug))
      .limit(1);

    if (existing.length === 0) {
      return testSlug;
    }

    counter++;
    testSlug = `${slug}-${counter}`;
  }
}

/**
 * Create a new form
 */
export async function createForm(
  data: CreateFormData,
  userId: string
): Promise<Form> {
  // Generate unique slug if not provided
  const slug = data.slug || (await generateUniqueSlug(data.name, data.workspaceId));

  const result = await db
    .insert(forms)
    .values({
      ...data,
      slug,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  return result[0] as Form;
}

/**
 * Get form by ID
 */
export async function getForm(id: string): Promise<Form | null> {
  const result = await db
    .select()
    .from(forms)
    .where(eq(forms.id, id))
    .limit(1);

  return result.length > 0 ? (result[0] as Form) : null;
}

/**
 * Get form by slug (for public access)
 */
export async function getFormBySlug(slug: string): Promise<Form | null> {
  const result = await db
    .select()
    .from(forms)
    .where(and(eq(forms.slug, slug), eq(forms.isActive, true)))
    .limit(1);

  return result.length > 0 ? (result[0] as Form) : null;
}

/**
 * List all forms for a workspace
 */
export async function listForms(
  workspaceId: string,
  activeOnly: boolean = false
): Promise<Form[]> {
  const conditions = [eq(forms.workspaceId, workspaceId)];

  if (activeOnly) {
    conditions.push(eq(forms.isActive, true));
  }

  const result = await db
    .select()
    .from(forms)
    .where(and(...conditions))
    .orderBy(desc(forms.createdAt));

  return result as Form[];
}

/**
 * Update a form
 */
export async function updateForm(
  id: string,
  data: UpdateFormData
): Promise<Form> {
  const updates: any = {
    ...data,
    updatedAt: new Date()
  };

  // Generate new slug if name is being updated
  if (data.name && !data.slug) {
    const form = await getForm(id);
    if (form) {
      updates.slug = await generateUniqueSlug(data.name, form.workspaceId);
    }
  }

  const result = await db
    .update(forms)
    .set(updates)
    .where(eq(forms.id, id))
    .returning();

  return result[0] as Form;
}

/**
 * Delete a form
 */
export async function deleteForm(id: string): Promise<void> {
  await db.delete(forms).where(eq(forms.id, id));
}

/**
 * Archive a form (soft delete)
 */
export async function archiveForm(id: string): Promise<Form> {
  return await updateForm(id, { isActive: false });
}

/**
 * Duplicate a form
 */
export async function duplicateForm(
  id: string,
  userId: string
): Promise<Form> {
  const original = await getForm(id);

  if (!original) {
    throw new Error('Form not found');
  }

  const newSlug = await generateUniqueSlug(`${original.name} (copy)`, original.workspaceId);

  return await createForm(
    {
      workspaceId: original.workspaceId,
      name: `${original.name} (copy)`,
      slug: newSlug,
      logoUrl: original.logoUrl,
      leftContent: original.leftContent,
      type: original.type,
      linkedItemId: original.linkedItemId,
      footerContent: original.footerContent,
      isActive: false // Start duplicates as inactive
    },
    userId
  );
}

/**
 * Get form statistics
 */
export async function getFormStats(id: string) {
  // TODO: Implement stats calculation
  // This will need to join with form_submissions table
  return {
    submissionCount: 0,
    totalRaised: 0,
    activeSubscriptions: 0,
    lastSubmission: null
  };
}

/**
 * Replace field bindings in content
 */
export function replaceFieldBindings(
  content: string,
  bindings: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(bindings)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  let query = db.select().from(forms).where(eq(forms.slug, slug));

  const result = await query.limit(1);

  if (result.length === 0) {
    return true;
  }

  // If excluding an ID (for updates), check if the found form is the one being excluded
  if (excludeId && result[0].id === excludeId) {
    return true;
  }

  return false;
}

/**
 * Get public form data with workspace and linked item
 */
export async function getPublicFormData(slug: string) {
  const form = await getFormBySlug(slug);

  if (!form) {
    return null;
  }

  // Get workspace data
  const { workspaces, donations, products, subscriptions } = await import('$lib/db/drizzle/schema');

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, form.workspaceId))
    .limit(1);

  if (!workspace) {
    return null;
  }

  // Get linked item based on form type
  let linkedItem = null;
  if (form.type === 'donation') {
    const [donation] = await db
      .select()
      .from(donations)
      .where(eq(donations.id, form.linkedItemId))
      .limit(1);
    linkedItem = donation;
  } else if (form.type === 'product') {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, form.linkedItemId))
      .limit(1);
    linkedItem = product;
  } else if (form.type === 'subscription') {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, form.linkedItemId))
      .limit(1);
    linkedItem = subscription;
  }

  // Generate field bindings
  const availableBindings = {
    org_name: workspace.name || 'Organization Name',
    ein: workspace.ein || 'Tax ID (EIN)',
    address: workspace.address || 'Organization Address',
    city: workspace.city || 'City',
    state: workspace.state || 'State',
    zip: workspace.zipCode || 'ZIP Code',
    phone: workspace.phone || 'Phone Number',
    email: workspace.email || 'Email Address',
    website: workspace.website || 'Website URL',
    year: new Date().getFullYear().toString(),
    date: new Date().toLocaleDateString()
  };

  return {
    form,
    workspace,
    linkedItem,
    availableBindings
  };
}
