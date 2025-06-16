import { db } from '$lib/server/db';
import { 
  importSessions, 
  importErrors,
  contacts,
  contactEmails,
  contactPhoneNumbers,
  contactAddresses,
  contactSocialMediaAccounts,
  contactTags,
  businesses,
  businessPhoneNumbers,
  businessAddresses,
  businessSocialMediaAccounts,
  businessTags,
  businessEmployees,
  donations,
  states,
  zipCodes,
  genders,
  races
} from '$lib/db/drizzle/schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import type { 
  ImportSession, 
  ImportError, 
  BatchProcessResult,
  ImportProgress 
} from '$lib/types/import';
import { IMPORT_CONFIGS, ENUM_DEFAULTS } from '$lib/config/importConfigs';

export class ImportService {
  /**
   * Create a new import session
   */
  static async createImportSession(
    workspaceId: string,
    importType: 'contacts' | 'businesses' | 'donations',
    filename: string,
    totalRecords: number,
    importMode: 'create_only' | 'update_or_create',
    duplicateField: string,
    fieldMapping: Record<string, string>,
    userId: string
  ): Promise<string> {
    const [session] = await db
      .insert(importSessions)
      .values({
        workspaceId,
        importType,
        filename,
        totalRecords,
        importMode,
        duplicateField,
        fieldMapping,
        createdById: userId
      })
      .returning();
    
    return session.id;
  }

  /**
   * Get import session by ID
   */
  static async getImportSession(sessionId: string): Promise<ImportSession | null> {
    const [session] = await db
      .select()
      .from(importSessions)
      .where(eq(importSessions.id, sessionId))
      .limit(1);
    
    return session || null;
  }

  /**
   * Update import session progress
   */
  static async updateSessionProgress(
    sessionId: string,
    processedCount: number,
    successfulCount: number,
    failedCount: number,
    status?: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    const updateData: any = {
      processedRecords: processedCount,
      successfulRecords: successfulCount,
      failedRecords: failedCount,
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
    }

    await db
      .update(importSessions)
      .set(updateData)
      .where(eq(importSessions.id, sessionId));
  }

  /**
   * Process a batch of import data
   */
  static async processImportBatch(
    sessionId: string,
    batchData: any[],
    startIndex: number,
    validateOnly: boolean = false
  ): Promise<BatchProcessResult> {
    console.log(`ImportService.processImportBatch called:`, {
      sessionId,
      startIndex,
      batchSize: batchData.length,
      validateOnly
    });

    // Get session details
    const session = await this.getImportSession(sessionId);
    if (!session) {
      throw new Error('Import session not found');
    }

    console.log('Session details:', {
      importType: session.importType,
      fieldMapping: session.fieldMapping,
      importMode: session.importMode
    });

    const config = IMPORT_CONFIGS[session.importType];
    if (!config) {
      throw new Error(`Invalid import type: ${session.importType}`);
    }
    
    let successful = 0;
    let failed = 0;
    const errors: Array<{ rowNumber: number; error: string; data: any }> = [];

    // Update session status to processing
    await this.updateSessionProgress(
      sessionId, 
      session.processedRecords, 
      session.successfulRecords, 
      session.failedRecords, 
      'processing'
    );

    for (let i = 0; i < batchData.length; i++) {
      const rowIndex = startIndex + i;
      const row = batchData[i];
      
      // Check if session was cancelled before processing each row
      const currentSession = await this.getImportSession(sessionId);
      if (currentSession && currentSession.status === 'failed') {
        console.log(`Session ${sessionId} was cancelled, stopping batch processing`);
        break;
      }

      try {
        console.log(`Processing row ${rowIndex + 1}:`, row);
        
        const mappedData = this.mapRowData(row, session.fieldMapping, config);
        console.log('Mapped data:', mappedData);
        
        if (validateOnly) {
          // Validation-only mode: just validate the data without creating records
          await this.validateRecord(session.importType, mappedData, session.workspaceId, session.duplicateField);
          console.log(`Row ${rowIndex + 1} validation successful`);
        } else {
          // Normal mode: create or update records
          if (session.importMode === 'update_or_create') {
            await this.upsertRecord(session.importType, mappedData, session.workspaceId, session.duplicateField);
          } else {
            await this.createRecord(session.importType, mappedData, session.workspaceId);
          }
          console.log(`Row ${rowIndex + 1} processed successfully`);
        }
        
        successful++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing row ${rowIndex + 1}:`, {
          error: errorMessage,
          row,
          mappedData: this.mapRowData(row, session.fieldMapping, config)
        });
        
        errors.push({
          rowNumber: rowIndex + 1,
          error: errorMessage,
          data: row
        });
        
        // Log error to database
        try {
          await this.logImportError(sessionId, rowIndex + 1, errorMessage, row);
        } catch (logError) {
          console.error('Failed to log import error:', logError);
        }
      }
    }

    // Update session progress
    const newProcessed = session.processedRecords + batchData.length;
    const newSuccessful = session.successfulRecords + successful;
    const newFailed = session.failedRecords + failed;
    
    // Determine if import is complete
    const isComplete = newProcessed >= session.totalRecords;
    const finalStatus = isComplete ? 'completed' : 'processing';

    await this.updateSessionProgress(
      sessionId, 
      newProcessed, 
      newSuccessful, 
      newFailed,
      finalStatus
    );

    console.log('Batch processing result:', {
      successful,
      failed,
      errorsCount: errors.length,
      newProcessed,
      isComplete
    });

    return { successful, failed, errors };
  }

  /**
   * Map CSV row data to database fields
   */
  private static mapRowData(
    row: any,
    fieldMapping: Record<string, string>,
    config: any
  ): any {
    const mappedData: any = {};

    Object.entries(fieldMapping).forEach(([csvColumn, dbField]) => {
      if (row[csvColumn] !== undefined && dbField) {
        let value = row[csvColumn];
        
        // Clean and process the value
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value !== 'string') {
          // Convert non-string values to strings (handles numbers, booleans, etc.)
          value = String(value);
        }
        
        // Trim string values and skip empty ones
        if (typeof value === 'string') {
          value = value.trim();
          // Skip completely empty values or 'null'/'undefined' strings
          if (value === '' || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
            return;
          }
        }
        
        mappedData[dbField] = value;
      }
    });

    return mappedData;
  }

  /**
   * Validate a record without creating it (for validation-only mode)
   */
  private static async validateRecord(
    importType: string,
    data: any,
    workspaceId: string,
    duplicateField: string
  ): Promise<void> {
    // Check for required fields based on import type
    const config = IMPORT_CONFIGS[importType];
    
    if (!config) {
      throw new Error(`Invalid import type: ${importType}`);
    }
    
    // Validate required fields
    for (const field of config.requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        throw new Error(`Required field '${field}' is missing or empty`);
      }
    }
    
    // Validate field formats based on validation rules
    for (const [field, rule] of Object.entries(config.validationRules)) {
      const value = data[field];
      if (value && value !== '') {
        // Basic validation based on rule type
        if (rule.type === 'email' && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const emails = value.split(',').map(email => email.trim());
          for (const email of emails) {
            if (!emailRegex.test(email)) {
              throw new Error(`Invalid email format: ${email}`);
            }
          }
        }
        
        if (rule.type === 'phone' && typeof value === 'string') {
          const phoneRegex = /^\+?[\d\s\-\(\)\.]+$/;
          const phones = value.split(',').map(phone => phone.trim());
          for (const phone of phones) {
            if (!phoneRegex.test(phone)) {
              throw new Error(`Invalid phone format: ${phone}`);
            }
          }
        }
        
        if (rule.type === 'number') {
          const num = parseFloat(value);
          if (isNaN(num)) {
            throw new Error(`Field '${field}' must be a valid number`);
          }
          if (rule.min !== undefined && num < rule.min) {
            throw new Error(`Field '${field}' must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && num > rule.max) {
            throw new Error(`Field '${field}' must be at most ${rule.max}`);
          }
        }
        
        if (rule.type === 'enum' && rule.options) {
          if (!rule.options.includes(value)) {
            throw new Error(`Field '${field}' must be one of: ${rule.options.join(', ')}`);
          }
        }
      }
    }
    
    // Check for potential duplicates if in update mode
    if (duplicateField && data[duplicateField]) {
      const existing = await this.findExistingRecord(importType, data, workspaceId, duplicateField);
      if (existing) {
        // This is expected in validation mode, just note it
        console.log(`Potential duplicate found for ${duplicateField}: ${data[duplicateField]}`);
      }
    }
    
    // Additional type-specific validation
    await this.validateTypeSpecificData(importType, data, workspaceId);
  }
  
  /**
   * Perform type-specific validation (without database operations)
   */
  private static async validateTypeSpecificData(
    importType: string,
    data: any,
    workspaceId: string
  ): Promise<void> {
    switch (importType) {
      case 'contacts':
        // Validate gender/race references exist (if provided)
        if (data.genderId && typeof data.genderId === 'string') {
          const [gender] = await db
            .select({ id: genders.id })
            .from(genders)
            .where(ilike(genders.gender, data.genderId))
            .limit(1);
          if (!gender) {
            console.warn(`Gender '${data.genderId}' not found in database - will be skipped`);
          }
        }
        
        if (data.raceId && typeof data.raceId === 'string') {
          const [race] = await db
            .select({ id: races.id })
            .from(races)
            .where(ilike(races.race, data.raceId))
            .limit(1);
          if (!race) {
            console.warn(`Race '${data.raceId}' not found in database - will be skipped`);
          }
        }
        break;
        
      case 'businesses':
        // Validate business-specific data
        if (data.status && !['active', 'inactive', 'closed'].includes(data.status)) {
          throw new Error(`Invalid business status: ${data.status}. Must be one of: active, inactive, closed`);
        }
        break;
        
      case 'donations':
        // Validate donation amount
        if (data.amount) {
          const amount = parseFloat(data.amount);
          if (isNaN(amount) || amount < 0) {
            throw new Error('Donation amount must be a positive number');
          }
        }
        
        // Check if donor contact/business exists (if provided)
        if (data.donorEmail) {
          const [contact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .innerJoin(contactEmails, eq(contacts.id, contactEmails.contactId))
            .where(
              and(
                eq(contacts.workspaceId, workspaceId),
                eq(contactEmails.email, data.donorEmail)
              )
            )
            .limit(1);
          if (!contact) {
            console.warn(`Donor contact with email '${data.donorEmail}' not found`);
          }
        }
        
        if (data.businessName) {
          const [business] = await db
            .select({ id: businesses.id })
            .from(businesses)
            .where(
              and(
                eq(businesses.workspaceId, workspaceId),
                ilike(businesses.businessName, data.businessName)
              )
            )
            .limit(1);
          if (!business) {
            console.warn(`Business '${data.businessName}' not found`);
          }
        }
        break;
    }
  }

  /**
   * Create a new record
   */
  private static async createRecord(
    importType: string,
    data: any,
    workspaceId: string
  ): Promise<void> {
    switch (importType) {
      case 'contacts':
        await this.createContact(data, workspaceId);
        break;
      case 'businesses':
        await this.createBusiness(data, workspaceId);
        break;
      case 'donations':
        await this.createDonation(data, workspaceId);
        break;
      default:
        throw new Error(`Unsupported import type: ${importType}`);
    }
  }

  /**
   * Update or create a record (upsert)
   */
  private static async upsertRecord(
    importType: string,
    data: any,
    workspaceId: string,
    duplicateField: string
  ): Promise<void> {
    // Find existing record
    const existing = await this.findExistingRecord(importType, data, workspaceId, duplicateField);
    
    if (existing) {
      // Update existing record
      await this.updateRecord(importType, existing.id, data, workspaceId);
    } else {
      // Create new record
      await this.createRecord(importType, data, workspaceId);
    }
  }

  /**
   * Find existing record for duplicate checking
   */
  private static async findExistingRecord(
    importType: string,
    data: any,
    workspaceId: string,
    duplicateField: string
  ): Promise<any> {
    const searchValue = data[duplicateField];
    if (!searchValue) return null;

    switch (importType) {
      case 'contacts':
        if (duplicateField === 'emails') {
          const [contact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .innerJoin(contactEmails, eq(contacts.id, contactEmails.contactId))
            .where(
              and(
                eq(contacts.workspaceId, workspaceId),
                eq(contactEmails.email, searchValue)
              )
            )
            .limit(1);
          return contact;
        } else if (duplicateField === 'vanid') {
          const [contact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(
              and(
                eq(contacts.workspaceId, workspaceId),
                eq(contacts.vanid, searchValue)
              )
            )
            .limit(1);
          return contact;
        }
        break;
      
      case 'businesses':
        if (duplicateField === 'businessName') {
          const [business] = await db
            .select({ id: businesses.id })
            .from(businesses)
            .where(
              and(
                eq(businesses.workspaceId, workspaceId),
                ilike(businesses.businessName, searchValue)
              )
            )
            .limit(1);
          return business;
        }
        break;
    }

    return null;
  }

  /**
   * Update existing record
   */
  private static async updateRecord(
    importType: string,
    recordId: string,
    data: any,
    workspaceId: string
  ): Promise<void> {
    switch (importType) {
      case 'contacts':
        await this.updateContact(recordId, data, workspaceId);
        break;
      case 'businesses':
        await this.updateBusiness(recordId, data, workspaceId);
        break;
      case 'donations':
        await this.updateDonation(recordId, data);
        break;
    }
  }

  /**
   * Create a contact with related data
   */
  private static async createContact(data: any, workspaceId: string): Promise<void> {
    console.log('Creating contact with data:', data);
    
    // Validate required fields
    if (!data.firstName || !data.lastName) {
      throw new Error('Missing required fields: firstName and lastName are required');
    }

    // Find or create gender and race if specified
    let genderId = null;
    let raceId = null;

    if (data.genderId && typeof data.genderId === 'string') {
      try {
        const [gender] = await db
          .select()
          .from(genders)
          .where(ilike(genders.gender, data.genderId))
          .limit(1);
        genderId = gender?.id || null;
        console.log('Found gender:', { input: data.genderId, found: gender?.id });
      } catch (error) {
        console.error('Error looking up gender:', error);
      }
    }

    if (data.raceId && typeof data.raceId === 'string') {
      try {
        const [race] = await db
          .select()
          .from(races)
          .where(ilike(races.race, data.raceId))
          .limit(1);
        raceId = race?.id || null;
        console.log('Found race:', { input: data.raceId, found: race?.id });
      } catch (error) {
        console.error('Error looking up race:', error);
      }
    }

    // Create the main contact record
    try {
      const [newContact] = await db
        .insert(contacts)
        .values({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          middleName: data.middleName ? data.middleName.trim() : null,
          genderId,
          raceId,
          pronouns: data.pronouns ? data.pronouns.trim() : null,
          vanid: data.vanid ? data.vanid.trim() : null,
          status: ENUM_DEFAULTS.contactStatus,
          workspaceId
        })
        .returning();

      console.log('Created contact:', newContact.id);

      // Create related records
      await this.createContactRelatedData(newContact.id, data);
      console.log('Created contact related data for:', newContact.id);
    } catch (error) {
      console.error('Error creating contact:', error);
      console.error('Contact data that failed:', {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        genderId,
        raceId,
        pronouns: data.pronouns,
        vanid: data.vanid,
        workspaceId
      });
      throw error;
    }
  }

  /**
   * Update existing contact
   */
  private static async updateContact(contactId: string, data: any, workspaceId: string): Promise<void> {
    // Update main contact record
    await db
      .update(contacts)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        pronouns: data.pronouns || null,
        vanid: data.vanid || null,
        updatedAt: new Date()
      })
      .where(eq(contacts.id, contactId));

    // Update related data (merge with existing, don't duplicate)
    await this.updateContactRelatedData(contactId, data);
  }

  /**
   * Create contact related data (emails, phones, addresses, etc.)
   */
  private static async createContactRelatedData(contactId: string, data: any): Promise<void> {
    // Create emails
    if (data.emails && typeof data.emails === 'string' && data.emails.trim()) {
      const emails = data.emails.split(',').map((email: string) => email.trim()).filter(email => email);
      for (const email of emails) {
        if (email) {
          await db.insert(contactEmails).values({
            contactId,
            email,
            status: ENUM_DEFAULTS.contactEmailStatus
          });
        }
      }
    }

    // Create phone numbers
    if (data.phoneNumbers) {
      // Convert to string and handle various input types
      const phoneString = String(data.phoneNumbers).trim();
      if (phoneString && phoneString !== 'null' && phoneString !== 'undefined') {
        const phones = phoneString.split(',').map((phone: string) => phone.trim()).filter(phone => phone);
        for (const phone of phones) {
          if (phone) {
            await db.insert(contactPhoneNumbers).values({
              contactId,
              phoneNumber: phone,
              status: ENUM_DEFAULTS.contactPhoneStatus
            });
          }
        }
      }
    }

    // Create addresses - handle both structured and unstructured formats
    await this.createContactAddresses(contactId, data);

    // Create social media accounts
    if (data.socialMediaAccounts && typeof data.socialMediaAccounts === 'string' && data.socialMediaAccounts.trim()) {
      const socialMedia = data.socialMediaAccounts.split(',').map((sm: string) => sm.trim()).filter(sm => sm);
      for (const sm of socialMedia) {
        if (sm && sm.includes(':')) {
          const [platform, handle] = sm.split(':');
          if (platform && handle) {
            await db.insert(contactSocialMediaAccounts).values({
              contactId,
              serviceType: platform.toLowerCase(),
              socialMediaAccount: handle.trim(),
              status: ENUM_DEFAULTS.socialMediaStatus
            });
          }
        }
      }
    }

    // Create tags
    if (data.tags && typeof data.tags === 'string' && data.tags.trim()) {
      const tags = data.tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag);
      for (const tag of tags) {
        if (tag) {
          await db.insert(contactTags).values({
            contactId,
            tag
          });
        }
      }
    }
  }

  /**
   * Create contact addresses from either structured fields or combined addresses
   */
  private static async createContactAddresses(contactId: string, data: any): Promise<void> {
    // Check if we have individual address fields
    const hasStructuredAddress = data.streetAddress || data.city || data.state || data.zipCode;
    
    if (hasStructuredAddress) {
      // Create address from individual fields
      await this.createStructuredContactAddress(contactId, data);
    }
    
    // Also process combined addresses field if present
    if (data.addresses && typeof data.addresses === 'string' && data.addresses.trim()) {
      const addresses = data.addresses.split(',').map((addr: string) => addr.trim()).filter(addr => addr);
      for (const address of addresses) {
        if (address) {
          await this.createParsedContactAddress(contactId, address);
        }
      }
    }
  }

  /**
   * Update contact related data (merge with existing, avoid duplicates)
   */
  private static async updateContactRelatedData(contactId: string, data: any): Promise<void> {
    // Update emails (add new ones that don't exist)
    if (data.emails && typeof data.emails === 'string' && data.emails.trim()) {
      const emails = data.emails.split(',').map((email: string) => email.trim()).filter(email => email);
      for (const email of emails) {
        if (email) {
          // Check if email already exists for this contact
          const [existingEmail] = await db
            .select({ id: contactEmails.id })
            .from(contactEmails)
            .where(
              and(
                eq(contactEmails.contactId, contactId),
                ilike(contactEmails.email, email)
              )
            )
            .limit(1);

          if (!existingEmail) {
            await db.insert(contactEmails).values({
              contactId,
              email,
              status: ENUM_DEFAULTS.contactEmailStatus
            });
          }
        }
      }
    }

    // Update phone numbers (add new ones that don't exist)
    if (data.phoneNumbers) {
      const phoneString = String(data.phoneNumbers).trim();
      if (phoneString && phoneString !== 'null' && phoneString !== 'undefined') {
        const phones = phoneString.split(',').map((phone: string) => phone.trim()).filter(phone => phone);
        for (const phone of phones) {
          if (phone) {
            // Check if phone number already exists for this contact
            const [existingPhone] = await db
              .select({ id: contactPhoneNumbers.id })
              .from(contactPhoneNumbers)
              .where(
                and(
                  eq(contactPhoneNumbers.contactId, contactId),
                  eq(contactPhoneNumbers.phoneNumber, phone)
                )
              )
              .limit(1);

            if (!existingPhone) {
              await db.insert(contactPhoneNumbers).values({
                contactId,
                phoneNumber: phone,
                status: ENUM_DEFAULTS.contactPhoneStatus
              });
            }
          }
        }
      }
    }

    // Update addresses (merge with existing)
    await this.updateContactAddresses(contactId, data);

    // Update social media accounts (add new ones that don't exist)
    if (data.socialMediaAccounts && typeof data.socialMediaAccounts === 'string' && data.socialMediaAccounts.trim()) {
      const socialMedia = data.socialMediaAccounts.split(',').map((sm: string) => sm.trim()).filter(sm => sm);
      for (const sm of socialMedia) {
        if (sm && sm.includes(':')) {
          const [platform, handle] = sm.split(':');
          if (platform && handle) {
            // Check if social media account already exists for this contact
            const [existingSocial] = await db
              .select({ id: contactSocialMediaAccounts.id })
              .from(contactSocialMediaAccounts)
              .where(
                and(
                  eq(contactSocialMediaAccounts.contactId, contactId),
                  eq(contactSocialMediaAccounts.serviceType, platform.toLowerCase()),
                  ilike(contactSocialMediaAccounts.socialMediaAccount, handle.trim())
                )
              )
              .limit(1);

            if (!existingSocial) {
              await db.insert(contactSocialMediaAccounts).values({
                contactId,
                serviceType: platform.toLowerCase(),
                socialMediaAccount: handle.trim(),
                status: ENUM_DEFAULTS.socialMediaStatus
              });
            }
          }
        }
      }
    }

    // Update tags (add new ones that don't exist)
    if (data.tags && typeof data.tags === 'string' && data.tags.trim()) {
      const tags = data.tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag);
      for (const tag of tags) {
        if (tag) {
          // Check if tag already exists for this contact
          const [existingTag] = await db
            .select({ id: contactTags.id })
            .from(contactTags)
            .where(
              and(
                eq(contactTags.contactId, contactId),
                ilike(contactTags.tag, tag)
              )
            )
            .limit(1);

          if (!existingTag) {
            await db.insert(contactTags).values({
              contactId,
              tag
            });
          }
        }
      }
    }
  }

  /**
   * Update contact addresses from either structured fields or combined addresses
   */
  private static async updateContactAddresses(contactId: string, data: any): Promise<void> {
    // Check if we have individual address fields
    const hasStructuredAddress = data.streetAddress || data.city || data.state || data.zipCode;
    
    if (hasStructuredAddress) {
      // Create address from individual fields (check for duplicates)
      await this.updateStructuredContactAddress(contactId, data);
    }
    
    // Also process combined addresses field if present
    if (data.addresses && typeof data.addresses === 'string' && data.addresses.trim()) {
      const addresses = data.addresses.split(',').map((addr: string) => addr.trim()).filter(addr => addr);
      for (const address of addresses) {
        if (address) {
          await this.updateParsedContactAddress(contactId, address);
        }
      }
    }
  }

  /**
   * Update a single address from structured fields (check for duplicates)
   */
  private static async updateStructuredContactAddress(contactId: string, data: any): Promise<void> {
    const streetAddress = data.streetAddress && typeof data.streetAddress === 'string' ? data.streetAddress.trim() : '';
    const secondaryStreetAddress = data.secondaryStreetAddress && typeof data.secondaryStreetAddress === 'string' ? data.secondaryStreetAddress.trim() : null;
    const city = data.city && typeof data.city === 'string' ? data.city.trim() : '';
    const state = data.state && typeof data.state === 'string' ? data.state.trim() : null;
    const zipCode = data.zipCode && typeof data.zipCode === 'string' ? data.zipCode.trim() : null;

    // Only create address if we have at least street address and city
    if (streetAddress && city) {
      // Check if similar address already exists
      const [existingAddress] = await db
        .select({ id: contactAddresses.id })
        .from(contactAddresses)
        .where(
          and(
            eq(contactAddresses.contactId, contactId),
            ilike(contactAddresses.streetAddress, streetAddress),
            ilike(contactAddresses.city, city)
          )
        )
        .limit(1);

      if (!existingAddress) {
        // Look up state ID if state is provided
        let stateId = null;
        if (state) {
          const [stateRecord] = await db
            .select({ id: states.id })
            .from(states)
            .where(
              or(
                ilike(states.name, state),
                ilike(states.abbreviation, state)
              )
            )
            .limit(1);
          stateId = stateRecord?.id || null;
        }

        // Look up zip code ID if zip code is provided
        let zipCodeId = null;
        if (zipCode) {
          const [zipRecord] = await db
            .select({ id: zipCodes.id })
            .from(zipCodes)
            .where(eq(zipCodes.name, zipCode))
            .limit(1);
          zipCodeId = zipRecord?.id || null;
        }

        await db.insert(contactAddresses).values({
          contactId,
          streetAddress,
          secondaryStreetAddress,
          city,
          stateId,
          zipCodeId,
          status: ENUM_DEFAULTS.contactAddressStatus
        });
      }
    }
  }

  /**
   * Update address from a parsed combined address string (check for duplicates)
   */
  private static async updateParsedContactAddress(contactId: string, address: string): Promise<void> {
    // Parse address (simplified - in production you'd want better parsing)
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const streetAddress = parts[0];
      const city = parts[1] || 'Unknown';

      // Check if similar address already exists
      const [existingAddress] = await db
        .select({ id: contactAddresses.id })
        .from(contactAddresses)
        .where(
          and(
            eq(contactAddresses.contactId, contactId),
            ilike(contactAddresses.streetAddress, streetAddress),
            ilike(contactAddresses.city, city)
          )
        )
        .limit(1);

      if (!existingAddress) {
        await db.insert(contactAddresses).values({
          contactId,
          streetAddress,
          city,
          status: ENUM_DEFAULTS.contactAddressStatus
        });
      }
    }
  }

  /**
   * Create a single address from structured fields
   */
  private static async createStructuredContactAddress(contactId: string, data: any): Promise<void> {
    const streetAddress = data.streetAddress && typeof data.streetAddress === 'string' ? data.streetAddress.trim() : '';
    const secondaryStreetAddress = data.secondaryStreetAddress && typeof data.secondaryStreetAddress === 'string' ? data.secondaryStreetAddress.trim() : null;
    const city = data.city && typeof data.city === 'string' ? data.city.trim() : '';
    const state = data.state && typeof data.state === 'string' ? data.state.trim() : null;
    const zipCode = data.zipCode && typeof data.zipCode === 'string' ? data.zipCode.trim() : null;

    // Only create address if we have at least street address and city
    if (streetAddress && city) {
      // Look up state ID if state is provided
      let stateId = null;
      if (state) {
        const [stateRecord] = await db
          .select({ id: states.id })
          .from(states)
          .where(
            or(
              ilike(states.name, state),
              ilike(states.abbreviation, state)
            )
          )
          .limit(1);
        stateId = stateRecord?.id || null;
      }

      // Look up zip code ID if zip code is provided
      let zipCodeId = null;
      if (zipCode) {
        const [zipRecord] = await db
          .select({ id: zipCodes.id })
          .from(zipCodes)
          .where(eq(zipCodes.name, zipCode))
          .limit(1);
        zipCodeId = zipRecord?.id || null;
      }

      await db.insert(contactAddresses).values({
        contactId,
        streetAddress,
        secondaryStreetAddress,
        city,
        stateId,
        zipCodeId,
        status: ENUM_DEFAULTS.contactAddressStatus
      });
    }
  }

  /**
   * Create address from a parsed combined address string
   */
  private static async createParsedContactAddress(contactId: string, address: string): Promise<void> {
    // Parse address (simplified - in production you'd want better parsing)
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      await db.insert(contactAddresses).values({
        contactId,
        streetAddress: parts[0],
        city: parts[1] || 'Unknown',
        status: ENUM_DEFAULTS.contactAddressStatus
      });
    }
  }

  /**
   * Create a business with related data
   */
  private static async createBusiness(data: any, workspaceId: string): Promise<void> {
    // Create the main business record
    const [newBusiness] = await db
      .insert(businesses)
      .values({
        businessName: data.businessName,
        status: data.status || ENUM_DEFAULTS.businessStatus,
        workspaceId
      })
      .returning();

    // Create related records
    await this.createBusinessRelatedData(newBusiness.id, data);
  }

  /**
   * Update existing business
   */
  private static async updateBusiness(businessId: string, data: any, workspaceId: string): Promise<void> {
    // Update main business record
    await db
      .update(businesses)
      .set({
        businessName: data.businessName,
        status: data.status || ENUM_DEFAULTS.businessStatus,
        updatedAt: new Date()
      })
      .where(eq(businesses.id, businessId));

    // Update related data
    await this.createBusinessRelatedData(businessId, data);
  }

  /**
   * Create business related data
   */
  private static async createBusinessRelatedData(businessId: string, data: any): Promise<void> {
    // Create phone numbers
    if (data.phoneNumbers) {
      // Convert to string and handle various input types
      const phoneString = String(data.phoneNumbers).trim();
      if (phoneString && phoneString !== 'null' && phoneString !== 'undefined') {
        const phones = phoneString.split(',').map((phone: string) => phone.trim()).filter(phone => phone);
        for (const phone of phones) {
          if (phone) {
            await db.insert(businessPhoneNumbers).values({
              businessId,
              phoneNumber: phone,
              status: ENUM_DEFAULTS.contactPhoneStatus
            });
          }
        }
      }
    }

    // Create addresses - handle both structured and unstructured formats
    await this.createBusinessAddresses(businessId, data);

    // Create social media accounts
    if (data.socialMediaAccounts && typeof data.socialMediaAccounts === 'string' && data.socialMediaAccounts.trim()) {
      const socialMedia = data.socialMediaAccounts.split(',').map((sm: string) => sm.trim()).filter(sm => sm);
      for (const sm of socialMedia) {
        if (sm && sm.includes(':')) {
          const [platform, handle] = sm.split(':');
          if (platform && handle) {
            await db.insert(businessSocialMediaAccounts).values({
              businessId,
              serviceType: platform.toLowerCase(),
              socialMediaAccount: handle.trim(),
              status: ENUM_DEFAULTS.socialMediaStatus
            });
          }
        }
      }
    }

    // Create tags
    if (data.tags && typeof data.tags === 'string' && data.tags.trim()) {
      const tags = data.tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag);
      for (const tag of tags) {
        if (tag) {
          await db.insert(businessTags).values({
            businessId,
            tag
          });
        }
      }
    }
  }

  /**
   * Create business addresses from either structured fields or combined addresses
   */
  private static async createBusinessAddresses(businessId: string, data: any): Promise<void> {
    // Check if we have individual address fields
    const hasStructuredAddress = data.streetAddress || data.city || data.state || data.zipCode;
    
    if (hasStructuredAddress) {
      // Create address from individual fields
      await this.createStructuredBusinessAddress(businessId, data);
    }
    
    // Also process combined addresses field if present
    if (data.addresses && typeof data.addresses === 'string' && data.addresses.trim()) {
      const addresses = data.addresses.split(',').map((addr: string) => addr.trim()).filter(addr => addr);
      for (const address of addresses) {
        if (address) {
          await this.createParsedBusinessAddress(businessId, address);
        }
      }
    }
  }

  /**
   * Create a single business address from structured fields
   */
  private static async createStructuredBusinessAddress(businessId: string, data: any): Promise<void> {
    const streetAddress = data.streetAddress && typeof data.streetAddress === 'string' ? data.streetAddress.trim() : '';
    const secondaryStreetAddress = data.secondaryStreetAddress && typeof data.secondaryStreetAddress === 'string' ? data.secondaryStreetAddress.trim() : null;
    const city = data.city && typeof data.city === 'string' ? data.city.trim() : '';
    const state = data.state && typeof data.state === 'string' ? data.state.trim() : null;
    const zipCode = data.zipCode && typeof data.zipCode === 'string' ? data.zipCode.trim() : null;

    // Only create address if we have at least street address and city
    if (streetAddress && city) {
      // Look up state ID if state is provided
      let stateId = null;
      if (state) {
        const [stateRecord] = await db
          .select({ id: states.id })
          .from(states)
          .where(
            or(
              ilike(states.name, state),
              ilike(states.abbreviation, state)
            )
          )
          .limit(1);
        stateId = stateRecord?.id || null;
      }

      // Look up zip code ID if zip code is provided
      let zipCodeId = null;
      if (zipCode) {
        const [zipRecord] = await db
          .select({ id: zipCodes.id })
          .from(zipCodes)
          .where(eq(zipCodes.name, zipCode))
          .limit(1);
        zipCodeId = zipRecord?.id || null;
      }

      await db.insert(businessAddresses).values({
        businessId,
        streetAddress,
        secondaryStreetAddress,
        city,
        stateId,
        zipCodeId,
        status: ENUM_DEFAULTS.contactAddressStatus
      });
    }
  }

  /**
   * Create business address from a parsed combined address string
   */
  private static async createParsedBusinessAddress(businessId: string, address: string): Promise<void> {
    // Parse address (simplified - in production you'd want better parsing)
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      await db.insert(businessAddresses).values({
        businessId,
        streetAddress: parts[0],
        city: parts[1] || 'Unknown',
        status: ENUM_DEFAULTS.contactAddressStatus
      });
    }
  }

  /**
   * Create a donation
   */
  private static async createDonation(data: any, workspaceId: string): Promise<void> {
    let contactId = data.contactId;
    let businessId = data.businessId;

    // Try to find contact/business by email or name if IDs not provided
    if (!contactId && data.donorEmail) {
      const [contact] = await db
        .select({ id: contacts.id })
        .from(contacts)
        .innerJoin(contactEmails, eq(contacts.id, contactEmails.contactId))
        .where(
          and(
            eq(contacts.workspaceId, workspaceId),
            eq(contactEmails.email, data.donorEmail)
          )
        )
        .limit(1);
      contactId = contact?.id;
    }

    if (!businessId && data.businessName) {
      const [business] = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(
          and(
            eq(businesses.workspaceId, workspaceId),
            ilike(businesses.businessName, data.businessName)
          )
        )
        .limit(1);
      businessId = business?.id;
    }

    if (!contactId && !businessId) {
      throw new Error('No valid contact or business found for donation');
    }

    // Create the donation
    await db.insert(donations).values({
      amount: Math.round(parseFloat(data.amount) * 100), // Convert to cents
      contactId: contactId || null,
      businessId: businessId || null,
      status: data.status || ENUM_DEFAULTS.donationStatus,
      paymentType: data.paymentType || null,
      notes: data.notes || null
    });
  }

  /**
   * Update existing donation
   */
  private static async updateDonation(donationId: string, data: any): Promise<void> {
    await db
      .update(donations)
      .set({
        amount: Math.round(parseFloat(data.amount) * 100),
        status: data.status || ENUM_DEFAULTS.donationStatus,
        paymentType: data.paymentType || null,
        notes: data.notes || null,
        updatedAt: new Date()
      })
      .where(eq(donations.id, donationId));
  }

  /**
   * Log import error to database
   */
  static async logImportError(
    sessionId: string,
    rowNumber: number,
    errorMessage: string,
    rawData: any,
    fieldName?: string,
    errorType: 'validation' | 'duplicate' | 'processing' = 'processing'
  ): Promise<void> {
    await db.insert(importErrors).values({
      importSessionId: sessionId,
      rowNumber,
      fieldName,
      errorType,
      errorMessage,
      rawData
    });
  }

  /**
   * Get import errors for a session
   */
  static async getImportErrors(sessionId: string): Promise<ImportError[]> {
    return await db
      .select()
      .from(importErrors)
      .where(eq(importErrors.importSessionId, sessionId));
  }

  /**
   * Get import progress
   */
  static async getImportProgress(sessionId: string): Promise<ImportProgress | null> {
    const session = await this.getImportSession(sessionId);
    if (!session) return null;

    const errors = await this.getImportErrors(sessionId);

    return {
      sessionId: session.id,
      totalRecords: session.totalRecords,
      processedRecords: session.processedRecords,
      successfulRecords: session.successfulRecords,
      failedRecords: session.failedRecords,
      status: session.status,
      errors
    };
  }

  /**
   * Cancel import session
   */
  static async cancelImportSession(sessionId: string): Promise<void> {
    await db
      .update(importSessions)
      .set({
        status: 'failed',
        updatedAt: new Date()
      })
      .where(eq(importSessions.id, sessionId));
  }

  /**
   * Delete import session and related data
   */
  static async deleteImportSession(sessionId: string): Promise<void> {
    // Errors will be deleted automatically due to CASCADE
    await db
      .delete(importSessions)
      .where(eq(importSessions.id, sessionId));
  }
}
