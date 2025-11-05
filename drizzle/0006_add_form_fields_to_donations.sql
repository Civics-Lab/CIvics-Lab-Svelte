-- Add form integration fields to donations table
ALTER TABLE donations ADD COLUMN IF NOT EXISTS form_id UUID;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS form_submission_id UUID;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS donation_date TIMESTAMP;

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'donations_form_id_forms_id_fk'
    ) THEN
        ALTER TABLE donations
        ADD CONSTRAINT donations_form_id_forms_id_fk
        FOREIGN KEY (form_id) REFERENCES forms(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'donations_form_submission_id_form_submissions_id_fk'
    ) THEN
        ALTER TABLE donations
        ADD CONSTRAINT donations_form_submission_id_form_submissions_id_fk
        FOREIGN KEY (form_submission_id) REFERENCES form_submissions(id);
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_donations_form_id ON donations(form_id);
CREATE INDEX IF NOT EXISTS idx_donations_form_submission_id ON donations(form_submission_id);
CREATE INDEX IF NOT EXISTS idx_donations_donation_date ON donations(donation_date);
