import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TemplateService } from '$lib/services/templateService';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Verify authentication
    if (!locals.user) {
      throw error(401, 'Authentication required');
    }

    const importType = url.searchParams.get('type');
    const format = url.searchParams.get('format') || 'csv';
    const includeInstructions = url.searchParams.get('instructions') === 'true';

    if (!importType) {
      throw error(400, 'Import type is required');
    }

    if (!['contacts', 'businesses', 'donations'].includes(importType)) {
      throw error(400, 'Invalid import type');
    }

    let csvContent: string;
    let filename: string;

    if (includeInstructions) {
      csvContent = TemplateService.generateTemplateWithInstructions(importType);
      filename = `${importType}_template_with_instructions.csv`;
    } else {
      const template = TemplateService.generateCSVTemplate(importType);
      csvContent = TemplateService.templateToCSV(template);
      filename = template.filename;
    }

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (err) {
    console.error('Template download error:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Template generation failed: ${errorMessage}`);
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Verify authentication
    if (!locals.user) {
      throw error(401, 'Authentication required');
    }

    const { importType, includeInstructions = false } = await request.json();

    if (!importType) {
      throw error(400, 'Import type is required');
    }

    if (!['contacts', 'businesses', 'donations'].includes(importType)) {
      throw error(400, 'Invalid import type');
    }

    let templateData;

    if (includeInstructions) {
      const csvContent = TemplateService.generateTemplateWithInstructions(importType);
      templateData = {
        content: csvContent,
        filename: `${importType}_template_with_instructions.csv`,
        mimeType: 'text/csv'
      };
    } else {
      const template = TemplateService.generateCSVTemplate(importType);
      templateData = {
        template,
        content: TemplateService.templateToCSV(template),
        filename: template.filename,
        mimeType: 'text/csv'
      };
    }

    return new Response(JSON.stringify(templateData), {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('Template API error:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Template generation failed: ${errorMessage}`);
  }
};
