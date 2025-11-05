/**
 * Form Settings Service
 * Manages workspace-level form default settings
 */

import { db } from '$lib/server/db';
import { formSettings } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import type { EditorJsData } from '$lib/types/form';

export interface FormSettings {
  id: string;
  workspaceId: string;
  defaultFooterContent: EditorJsData;
  fieldBindings: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get default field bindings for a workspace
 */
export function getDefaultBindings(): Record<string, string> {
  return {
    org_name: 'Organization Name',
    ein: 'Tax ID (EIN)',
    address: 'Organization Address',
    city: 'City',
    state: 'State',
    zip: 'ZIP Code',
    phone: 'Phone Number',
    email: 'Email Address',
    website: 'Website URL',
    year: new Date().getFullYear().toString(),
    date: new Date().toLocaleDateString()
  };
}

/**
 * Get default footer content
 */
export function getDefaultFooterContent(): EditorJsData {
  return {
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: '<strong>Contribution Rules:</strong>'
        }
      },
      {
        type: 'list',
        data: {
          style: 'unordered',
          items: [
            'I am a U.S. citizen or lawfully admitted permanent resident.',
            'This contribution is made from my own funds, and not those of another.',
            'This contribution is not made from the general treasury funds of a corporation, labor organization, or national bank.',
            'I am at least eighteen years old.',
            'I am not a federal contractor.'
          ]
        }
      },
      {
        type: 'paragraph',
        data: {
          text: 'Contributions to {{org_name}} are not tax deductible. Federal law requires us to use our best efforts to collect and report the name, mailing address, occupation, and employer of individuals whose contributions exceed $200 in an election cycle.'
        }
      }
    ]
  };
}

/**
 * Get form settings for a workspace
 */
export async function getSettings(workspaceId: string): Promise<FormSettings | null> {
  const result = await db
    .select()
    .from(formSettings)
    .where(eq(formSettings.workspaceId, workspaceId))
    .limit(1);

  if (result.length === 0) {
    // Create default settings if none exist
    return await createDefaultSettings(workspaceId);
  }

  return result[0] as FormSettings;
}

/**
 * Create default settings for a workspace
 */
export async function createDefaultSettings(workspaceId: string): Promise<FormSettings> {
  const result = await db
    .insert(formSettings)
    .values({
      workspaceId,
      defaultFooterContent: getDefaultFooterContent(),
      fieldBindings: getDefaultBindings(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  return result[0] as FormSettings;
}

/**
 * Create custom settings for a workspace
 */
export async function createSettings(data: {
  workspaceId: string;
  defaultFooterTemplate: EditorJsData;
}): Promise<FormSettings> {
  const result = await db
    .insert(formSettings)
    .values({
      workspaceId: data.workspaceId,
      defaultFooterContent: data.defaultFooterTemplate,
      fieldBindings: getDefaultBindings(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  return result[0] as FormSettings;
}

/**
 * Update form settings
 */
export async function updateSettings(
  workspaceId: string,
  updates: {
    defaultFooterContent?: EditorJsData;
    fieldBindings?: Record<string, string>;
  }
): Promise<FormSettings> {
  const result = await db
    .update(formSettings)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(formSettings.workspaceId, workspaceId))
    .returning();

  if (result.length === 0) {
    // Settings don't exist, create them
    return await createDefaultSettings(workspaceId);
  }

  return result[0] as FormSettings;
}

/**
 * Get field bindings for a workspace with workspace-specific values
 */
export async function getFieldBindingsWithValues(
  workspaceId: string,
  workspace: any
): Promise<Record<string, string>> {
  const settings = await getSettings(workspaceId);
  const bindings = settings?.fieldBindings || getDefaultBindings();

  // Replace with actual workspace values
  return {
    ...bindings,
    org_name: workspace.name || bindings.org_name,
    // Add other workspace-specific fields as needed
    year: new Date().getFullYear().toString(),
    date: new Date().toLocaleDateString()
  };
}
