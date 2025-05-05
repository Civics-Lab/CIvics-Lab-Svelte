import { redirect } from '@sveltejs/kit';
import type { Workspace } from '$lib/types/supabase';

/**
 * Service names for type safety
 */
export const SERVICES = {
  ENGAGE: 'engage',
  HELPDESK: 'helpdesk',
  PATHWAY: 'pathway',
  PULSE: 'pulse',
  COMPASS: 'compass'
} as const;

export type ServiceName = typeof SERVICES[keyof typeof SERVICES];

/**
 * Map of service names to their access flag properties in the Workspace type
 */
const serviceAccessFlags: Record<ServiceName, keyof Workspace> = {
  [SERVICES.ENGAGE]: 'hasEngage',
  [SERVICES.HELPDESK]: 'hasHelpdesk',
  [SERVICES.PATHWAY]: 'hasPathway',
  [SERVICES.PULSE]: 'hasPulse',
  [SERVICES.COMPASS]: 'hasCompass'
};

/**
 * Check if a workspace has access to a specific service
 * 
 * @param workspace The workspace to check
 * @param service The service to check access for
 * @returns Boolean indicating if the workspace has access to the service
 */
export function hasServiceAccess(workspace: Workspace | null | undefined, service: ServiceName): boolean {
  if (!workspace) return false;
  
  const accessFlag = serviceAccessFlags[service];
  return Boolean(workspace[accessFlag]);
}

/**
 * Server-side middleware to check service access and redirect if needed
 * 
 * @param workspace The workspace to check
 * @param service The service to check access for
 * @param redirectTo Where to redirect if access is denied (default: '/app')
 * @throws Redirect if access is denied
 */
export function requireServiceAccess(
  workspace: Workspace | null | undefined,
  service: ServiceName,
  redirectTo: string = '/app'
): void {
  if (!hasServiceAccess(workspace, service)) {
    throw redirect(303, redirectTo);
  }
}

/**
 * Get a list of all services the workspace has access to
 * 
 * @param workspace The workspace to check
 * @returns Array of service names the workspace has access to
 */
export function getAccessibleServices(workspace: Workspace | null | undefined): ServiceName[] {
  if (!workspace) return [];
  
  return Object.entries(serviceAccessFlags)
    .filter(([_, flagName]) => Boolean(workspace[flagName]))
    .map(([serviceName]) => serviceName as ServiceName);
}

/**
 * Check if the user is a Super Admin for the given workspace
 * 
 * @param workspace The workspace with userRole property
 * @returns Boolean indicating if the user is a Super Admin
 */
export function isSuperAdmin(workspace: (Workspace & { userRole?: string }) | null | undefined): boolean {
  return Boolean(workspace?.userRole === 'Super Admin');
}

/**
 * Server-side middleware to check if user is a Super Admin and redirect if not
 * 
 * @param workspace The workspace with userRole property
 * @param redirectTo Where to redirect if not a Super Admin (default: '/app')
 * @throws Redirect if not a Super Admin
 */
export function requireSuperAdmin(
  workspace: (Workspace & { userRole?: string }) | null | undefined,
  redirectTo: string = '/app'
): void {
  if (!isSuperAdmin(workspace)) {
    throw redirect(303, redirectTo);
  }
}
