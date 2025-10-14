import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { importExportService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

// Validation schemas
const importActionSchema = z.object({
  action: z.enum([
    'create_session',
    'process_batch', 
    'get_progress',
    'get_session',
    'cancel_session',
    'delete_session',
    'validate_data',
    'check_duplicates'
  ]),
  workspaceId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  importType: z.enum(['contacts', 'businesses', 'donations']).optional(),
  filename: z.string().optional(),
  totalRecords: z.number().optional(),
  importMode: z.string().optional(),
  duplicateField: z.string().optional(),
  fieldMapping: z.record(z.string()).optional(),
  batchData: z.array(z.any()).optional(),
  startIndex: z.number().optional(),
  validateOnly: z.boolean().optional(),
  csvData: z.array(z.any()).optional()
});

const templateQuerySchema = z.object({
  type: z.enum(['contacts', 'businesses', 'donations']).optional(),
  instructions: z.string().optional()
});

const templateBodySchema = z.object({
  importType: z.enum(['contacts', 'businesses', 'donations']),
  includeInstructions: z.boolean().optional()
});

const configQuerySchema = z.object({
  type: z.enum(['contacts', 'businesses', 'donations']).optional()
});

export const importExportRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // POST /api/import-export - Handle import operations
  .post('/', zValidator('json', importActionSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { action, ...data } = c.req.valid('json');
    
    try {
      switch (action) {
        case 'create_session':
          const sessionResult = await importExportService.createSession(data, userId);
          return c.json(sessionResult);
        
        case 'process_batch':
          const batchResult = await importExportService.processBatch(data);
          return c.json(batchResult);
        
        case 'get_progress':
          const progressResult = await importExportService.getProgress(data.sessionId!);
          return c.json(progressResult);
        
        case 'get_session':
          const sessionDetails = await importExportService.getSession(data.sessionId!);
          return c.json(sessionDetails);
        
        case 'cancel_session':
          const cancelResult = await importExportService.cancelSession(data.sessionId!);
          return c.json(cancelResult);
        
        case 'delete_session':
          const deleteResult = await importExportService.deleteSession(data.sessionId!);
          return c.json(deleteResult);
        
        case 'validate_data':
          const validationResult = await importExportService.validateData(data);
          return c.json(validationResult);
        
        case 'check_duplicates':
          const duplicatesResult = await importExportService.checkDuplicates(data);
          return c.json(duplicatesResult);
        
        default:
          throw new HTTPException(400, { message: `Invalid action: ${action}` });
      }
    } catch (err) {
      console.error('Import/Export API error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('permission') || err.message.includes('access')) {
          throw new HTTPException(403, { message: err.message });
        }
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('required') || err.message.includes('Missing') || err.message.includes('Invalid')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: `Import operation failed: ${err.message || 'Unknown error'}` });
    }
  })

  // GET /api/import-export/template - Download CSV template
  .get('/template', zValidator('query', templateQuerySchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { type, instructions } = c.req.valid('query');
    
    if (!type) {
      throw new HTTPException(400, { message: 'Import type is required' });
    }
    
    try {
      const includeInstructions = instructions === 'true';
      const template = await importExportService.generateTemplate(type, includeInstructions);
      
      return new Response(template.content, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="${template.filename}"`,
          'Cache-Control': 'no-cache'
        }
      });
    } catch (err) {
      console.error('Template download error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: `Template generation failed: ${err.message || 'Unknown error'}` });
    }
  })

  // POST /api/import-export/template - Generate template data
  .post('/template', zValidator('json', templateBodySchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { importType, includeInstructions = false } = c.req.valid('json');
    
    try {
      const templateData = await importExportService.generateTemplate(importType, includeInstructions);
      return c.json(templateData);
    } catch (err) {
      console.error('Template API error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: `Template generation failed: ${err.message || 'Unknown error'}` });
    }
  })

  // GET /api/import-export/config - Get import configurations
  .get('/config', zValidator('query', configQuerySchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { type } = c.req.valid('query');
    
    try {
      const config = await importExportService.getImportConfig(type);
      return c.json(config);
    } catch (err) {
      console.error('Import config API error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: `Failed to get import configuration: ${err.message || 'Unknown error'}` });
    }
  });