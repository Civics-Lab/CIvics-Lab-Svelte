import 'dotenv/config';
import { db } from '../drizzle';
import { 
  users, 
  workspaces, 
  userWorkspaces, 
  genders, 
  races,
  states
} from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  try {
    // Add default genders
    const genderResult = await db.insert(genders).values([
      { gender: 'Male' },
      { gender: 'Female' },
      { gender: 'Non-binary' },
      { gender: 'Other' }
    ]).onConflictDoNothing().returning();
    console.log(`Genders seeded: ${genderResult.length} rows`);

    // Add default races
    const raceResult = await db.insert(races).values([
      { race: 'American Indian or Alaska Native' },
      { race: 'Asian' },
      { race: 'Black or African American' },
      { race: 'Hispanic or Latino' },
      { race: 'Native Hawaiian or Other Pacific Islander' },
      { race: 'White' },
      { race: 'Two or More Races' },
      { race: 'Other' }
    ]).onConflictDoNothing().returning();
    console.log(`Races seeded: ${raceResult.length} rows`);

    // Add a few US states
    const stateResult = await db.insert(states).values([
      { name: 'Alabama', abbreviation: 'AL' },
      { name: 'Alaska', abbreviation: 'AK' },
      { name: 'Arizona', abbreviation: 'AZ' },
      { name: 'Arkansas', abbreviation: 'AR' },
      { name: 'California', abbreviation: 'CA' },
      { name: 'Colorado', abbreviation: 'CO' },
      { name: 'Connecticut', abbreviation: 'CT' },
      { name: 'Delaware', abbreviation: 'DE' },
      { name: 'Florida', abbreviation: 'FL' },
      { name: 'Georgia', abbreviation: 'GA' }
    ]).onConflictDoNothing().returning();
    console.log(`States seeded: ${stateResult.length} rows`);

    // Create admin user if it doesn't exist
    const adminEmail = 'admin@civicslab.org';
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const adminResult = await db.insert(users).values({
        email: adminEmail,
        username: 'admin',
        passwordHash,
        displayName: 'Admin User',
        role: 'admin'
      }).returning();
      
      if (adminResult.length > 0) {
        const adminUser = adminResult[0];
        console.log('Admin user created:', adminUser.id);
        
        // Create demo workspace
        const workspaceResult = await db.insert(workspaces).values({
          name: 'Demo Workspace',
          createdById: adminUser.id
        }).returning();
        
        if (workspaceResult.length > 0) {
          const demoWorkspace = workspaceResult[0];
          console.log('Demo workspace created:', demoWorkspace.id);
          
          // Add admin to workspace
          await db.insert(userWorkspaces).values({
            userId: adminUser.id,
            workspaceId: demoWorkspace.id,
            role: 'Super Admin'
          });
          
          console.log('Admin added to demo workspace.');
        }
      }
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('Successfully completed database seeding');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
