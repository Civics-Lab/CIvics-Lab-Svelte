/**
 * Form Submission Service
 * Manages form submissions and related operations
 */

import { db } from '$lib/server/db';
import { formSubmissions } from '$lib/db/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { FormSubmission, CreateFormSubmissionData, SubmissionStatus } from '$lib/types/formSubmission';

/**
 * Create a new form submission
 */
export async function createSubmission(
  data: CreateFormSubmissionData
): Promise<FormSubmission> {
  const result = await db
    .insert(formSubmissions)
    .values({
      ...data,
      status: 'pending',
      submittedAt: new Date()
    })
    .returning();

  return result[0] as FormSubmission;
}

/**
 * Get submission by ID
 */
export async function getSubmission(id: string): Promise<FormSubmission | null> {
  const result = await db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.id, id))
    .limit(1);

  return result.length > 0 ? (result[0] as FormSubmission) : null;
}

/**
 * Get all submissions for a form
 */
export async function getSubmissionsByForm(
  formId: string,
  limit: number = 100,
  offset: number = 0
): Promise<FormSubmission[]> {
  const result = await db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.formId, formId))
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(limit)
    .offset(offset);

  return result as FormSubmission[];
}

/**
 * Get all submissions for a contact
 */
export async function getSubmissionsByContact(
  contactId: string
): Promise<FormSubmission[]> {
  const result = await db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.contactId, contactId))
    .orderBy(desc(formSubmissions.submittedAt));

  return result as FormSubmission[];
}

/**
 * Get submissions for a workspace
 */
export async function getSubmissionsByWorkspace(
  workspaceId: string,
  limit: number = 100,
  offset: number = 0
): Promise<FormSubmission[]> {
  const result = await db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.workspaceId, workspaceId))
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(limit)
    .offset(offset);

  return result as FormSubmission[];
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus
): Promise<FormSubmission> {
  const result = await db
    .update(formSubmissions)
    .set({ status })
    .where(eq(formSubmissions.id, id))
    .returning();

  return result[0] as FormSubmission;
}

/**
 * Get recent submissions for donor dashboard
 */
export async function getRecentSubmissionsForContact(
  contactId: string,
  limit: number = 5
): Promise<FormSubmission[]> {
  const result = await db
    .select()
    .from(formSubmissions)
    .where(
      and(
        eq(formSubmissions.contactId, contactId),
        eq(formSubmissions.status, 'completed')
      )
    )
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(limit);

  return result as FormSubmission[];
}

/**
 * Get submission statistics for a form
 */
export async function getFormSubmissionStats(formId: string) {
  const submissions = await getSubmissionsByForm(formId, 10000);

  const completedSubmissions = submissions.filter(s => s.status === 'completed');
  const totalRaised = completedSubmissions.reduce((sum, s) => sum + s.amount, 0);
  const averageDonation = completedSubmissions.length > 0
    ? Math.round(totalRaised / completedSubmissions.length)
    : 0;

  return {
    totalSubmissions: submissions.length,
    completedSubmissions: completedSubmissions.length,
    pendingSubmissions: submissions.filter(s => s.status === 'pending').length,
    failedSubmissions: submissions.filter(s => s.status === 'failed').length,
    totalRaised,
    averageDonation,
    lastSubmission: submissions.length > 0 ? submissions[0].submittedAt : null
  };
}

/**
 * Get total donated by a contact
 */
export async function getTotalDonatedByContact(contactId: string): Promise<number> {
  const submissions = await getSubmissionsByContact(contactId);

  return submissions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.amount, 0);
}
