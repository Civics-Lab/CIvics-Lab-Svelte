/**
 * Forms API Routes
 * Hono routes for forms management
 */

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { formsApiService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

// Validation schemas
const createFormSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().optional(),
  logoUrl: z.string().optional(),
  leftContent: z.object({
    blocks: z.array(z.any())
  }),
  type: z.enum(['donation', 'product', 'subscription']),
  linkedItemId: z.string().uuid(),
  footerContent: z.object({
    blocks: z.array(z.any())
  }),
  isActive: z.boolean().optional()
});

const updateFormSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  logoUrl: z.string().optional(),
  leftContent: z
    .object({
      blocks: z.array(z.any())
    })
    .optional(),
  type: z.enum(['donation', 'product', 'subscription']).optional(),
  linkedItemId: z.string().uuid().optional(),
  footerContent: z
    .object({
      blocks: z.array(z.any())
    })
    .optional(),
  isActive: z.boolean().optional()
});

const getFormsSchema = z.object({
  workspace_id: z.string().uuid(),
  active_only: z
    .string()
    .transform((val) => val === 'true')
    .optional()
});

const submitFormSchema = z.object({
  formId: z.string().uuid(),
  donorInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    amount: z.number().optional()
  }),
  paymentMethod: z.object({
    paymentIntentId: z.string(),
    paymentMethodId: z.string()
  }),
  amount: z.number().positive()
});

export const formsRouter = new Hono()
  // Public routes (no JWT required)
  // GET /api/forms/public/:slug - Get public form by slug
  .get('/public/:slug', async (c) => {
    const { slug } = c.req.param();

    try {
      const data = await formsApiService.getPublicForm(slug);

      if (!data) {
        throw new HTTPException(404, { message: 'Form not found or inactive' });
      }

      return c.json(data);
    } catch (error) {
      console.error('Error fetching public form:', error);

      if (error instanceof HTTPException) {
        throw error;
      }

      throw new HTTPException(500, { message: 'Failed to fetch form' });
    }
  })

  // POST /api/forms/submit - Submit a form (public)
  .post('/submit', zValidator('json', submitFormSchema), async (c) => {
    const data = c.req.valid('json');

    try {
      const result = await formsApiService.submitForm(data);
      return c.json(result, 201);
    } catch (error) {
      console.error('Error submitting form:', error);

      if (error instanceof Error) {
        throw new HTTPException(400, { message: error.message });
      }

      throw new HTTPException(500, { message: 'Failed to submit form' });
    }
  })

  // GET /api/forms/submissions/:id/public - Get submission details (public)
  .get('/submissions/:id/public', async (c) => {
    const { id } = c.req.param();

    try {
      const submission = await formsApiService.getSubmission(id);
      return c.json({ submission });
    } catch (error) {
      console.error('Error fetching submission:', error);

      if (error instanceof Error && error.message === 'Submission not found') {
        throw new HTTPException(404, { message: 'Submission not found' });
      }

      throw new HTTPException(500, { message: 'Failed to fetch submission' });
    }
  })

  // Protected routes (JWT required)
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))

  // GET /api/forms - Get all forms for workspace
  .get('/', zValidator('query', getFormsSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { workspace_id, active_only } = c.req.valid('query');

    try {
      const forms = await formsApiService.getForms(workspace_id, active_only || false);
      return c.json({ forms });
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw new HTTPException(500, { message: 'Failed to fetch forms' });
    }
  })

  // POST /api/forms - Create new form
  .post('/', zValidator('json', createFormSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const data = c.req.valid('json');

    try {
      const form = await formsApiService.createForm(data, userId);
      return c.json({ form }, 201);
    } catch (error) {
      console.error('Error creating form:', error);
      throw new HTTPException(500, { message: 'Failed to create form' });
    }
  })

  // GET /api/forms/:id - Get specific form
  .get('/:id', async (c) => {
    const { id } = c.req.param();

    try {
      const form = await formsApiService.getForm(id);
      return c.json({ form });
    } catch (error) {
      console.error('Error fetching form:', error);

      if (error instanceof Error && error.message === 'Form not found') {
        throw new HTTPException(404, { message: 'Form not found' });
      }

      throw new HTTPException(500, { message: 'Failed to fetch form' });
    }
  })

  // PUT /api/forms/:id - Update form
  .put('/:id', zValidator('json', updateFormSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { id } = c.req.param();
    const data = c.req.valid('json');

    try {
      const form = await formsApiService.updateForm(id, data);
      return c.json({ form });
    } catch (error) {
      console.error('Error updating form:', error);
      throw new HTTPException(500, { message: 'Failed to update form' });
    }
  })

  // DELETE /api/forms/:id - Delete form
  .delete('/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { id } = c.req.param();

    try {
      await formsApiService.deleteForm(id);
      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting form:', error);
      throw new HTTPException(500, { message: 'Failed to delete form' });
    }
  })

  // POST /api/forms/:id/archive - Archive form
  .post('/:id/archive', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { id } = c.req.param();

    try {
      const form = await formsApiService.archiveForm(id);
      return c.json({ form });
    } catch (error) {
      console.error('Error archiving form:', error);
      throw new HTTPException(500, { message: 'Failed to archive form' });
    }
  })

  // POST /api/forms/:id/duplicate - Duplicate form
  .post('/:id/duplicate', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { id } = c.req.param();

    try {
      const form = await formsApiService.duplicateForm(id, userId);
      return c.json({ form }, 201);
    } catch (error) {
      console.error('Error duplicating form:', error);
      throw new HTTPException(500, { message: 'Failed to duplicate form' });
    }
  })

  // GET /api/forms/:id/stats - Get form statistics
  .get('/:id/stats', async (c) => {
    const { id } = c.req.param();

    try {
      const stats = await formsApiService.getFormStats(id);
      return c.json({ stats });
    } catch (error) {
      console.error('Error fetching form stats:', error);
      throw new HTTPException(500, { message: 'Failed to fetch form statistics' });
    }
  })

  // POST /api/forms/check-slug - Check if slug is available
  .post('/check-slug', zValidator('json', z.object({ slug: z.string(), excludeId: z.string().optional() })), async (c) => {
    const { slug, excludeId } = c.req.valid('json');

    try {
      const result = await formsApiService.checkSlug(slug, excludeId);
      return c.json(result);
    } catch (error) {
      console.error('Error checking slug:', error);
      throw new HTTPException(500, { message: 'Failed to check slug availability' });
    }
  })

  // GET /api/forms/settings - Get form settings
  .get('/settings', async (c) => {
    const workspaceId = c.req.query('workspace_id');

    if (!workspaceId) {
      throw new HTTPException(400, { message: 'Workspace ID is required' });
    }

    try {
      const settings = await formsApiService.getSettings(workspaceId);
      return c.json({ settings });
    } catch (error) {
      console.error('Error fetching form settings:', error);
      throw new HTTPException(500, { message: 'Failed to fetch form settings' });
    }
  })

  // POST /api/forms/settings - Create form settings
  .post('/settings', zValidator('json', z.object({
    workspaceId: z.string().uuid(),
    defaultFooterTemplate: z.object({ blocks: z.array(z.any()) })
  })), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const data = c.req.valid('json');

    try {
      const settings = await formsApiService.createSettings(data);
      return c.json({ settings }, 201);
    } catch (error) {
      console.error('Error creating form settings:', error);
      throw new HTTPException(500, { message: 'Failed to create form settings' });
    }
  })

  // PUT /api/forms/settings - Update form settings
  .put('/settings', zValidator('json', z.object({
    workspaceId: z.string().uuid(),
    defaultFooterTemplate: z.object({ blocks: z.array(z.any()) }).optional()
  })), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const workspaceId = c.req.query('workspace_id');

    if (!workspaceId) {
      throw new HTTPException(400, { message: 'Workspace ID is required' });
    }

    const data = c.req.valid('json');

    try {
      const settings = await formsApiService.updateSettings(workspaceId, data);
      return c.json({ settings });
    } catch (error) {
      console.error('Error updating form settings:', error);
      throw new HTTPException(500, { message: 'Failed to update form settings' });
    }
  });
