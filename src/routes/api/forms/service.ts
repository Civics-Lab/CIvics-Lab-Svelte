/**
 * Forms API Service
 * Business logic for forms API endpoints
 */

import * as formService from '$lib/services/formService';
import * as formSubmissionService from '$lib/services/formSubmissionService';
import * as formSubmissionProcessingService from '$lib/services/formSubmissionProcessingService';
import * as formSettingsService from '$lib/services/formSettingsService';
import type { CreateFormData, UpdateFormData } from '$lib/types/form';

export const formsApiService = {
  /**
   * Get all forms for a workspace
   */
  async getForms(workspaceId: string, activeOnly: boolean = false) {
    return await formService.listForms(workspaceId, activeOnly);
  },

  /**
   * Create a new form
   */
  async createForm(data: CreateFormData, userId: string) {
    return await formService.createForm(data, userId);
  },

  /**
   * Get form by ID
   */
  async getForm(id: string) {
    const form = await formService.getForm(id);

    if (!form) {
      throw new Error('Form not found');
    }

    return form;
  },

  /**
   * Get form by slug (public)
   */
  async getFormBySlug(slug: string) {
    const form = await formService.getFormBySlug(slug);

    if (!form) {
      throw new Error('Form not found or inactive');
    }

    return form;
  },

  /**
   * Update a form
   */
  async updateForm(id: string, data: UpdateFormData) {
    return await formService.updateForm(id, data);
  },

  /**
   * Delete a form
   */
  async deleteForm(id: string) {
    await formService.deleteForm(id);
  },

  /**
   * Archive a form
   */
  async archiveForm(id: string) {
    return await formService.archiveForm(id);
  },

  /**
   * Duplicate a form
   */
  async duplicateForm(id: string, userId: string) {
    return await formService.duplicateForm(id, userId);
  },

  /**
   * Get form statistics
   */
  async getFormStats(id: string) {
    const stats = await formService.getFormStats(id);
    const submissionStats = await formSubmissionService.getFormSubmissionStats(id);

    return {
      ...stats,
      ...submissionStats
    };
  },

  /**
   * Check if slug is available
   */
  async checkSlug(slug: string, excludeId?: string) {
    const available = await formService.isSlugAvailable(slug, excludeId);
    return { available };
  },

  /**
   * Get public form data with workspace and linked item
   */
  async getPublicForm(slug: string) {
    return await formService.getPublicFormData(slug);
  },

  /**
   * Submit a form
   */
  async submitForm(data: formSubmissionProcessingService.SubmissionData) {
    // Get the form to determine workspace and type
    const form = await formService.getForm(data.formId);

    if (!form) {
      throw new Error('Form not found');
    }

    if (!form.isActive) {
      throw new Error('Form is not active');
    }

    // Process the submission
    const result = await formSubmissionProcessingService.processFormSubmission(
      form.workspaceId,
      form.type,
      form.linkedItemId,
      data
    );

    return result;
  },

  /**
   * Get submission by ID
   */
  async getSubmission(id: string) {
    const submission = await formSubmissionService.getSubmission(id);

    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission;
  },

  /**
   * Get form settings for a workspace
   */
  async getSettings(workspaceId: string) {
    return await formSettingsService.getSettings(workspaceId);
  },

  /**
   * Create form settings
   */
  async createSettings(data: any) {
    return await formSettingsService.createSettings(data);
  },

  /**
   * Update form settings
   */
  async updateSettings(workspaceId: string, data: any) {
    const updates: any = {};

    if (data.defaultFooterTemplate) {
      updates.defaultFooterContent = data.defaultFooterTemplate;
    }

    return await formSettingsService.updateSettings(workspaceId, updates);
  }
};
