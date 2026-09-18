-- Consequence framing on commitments - why it matters and what happens if skipped.
-- Both optional: existing rows and rules created without them still work.
ALTER TABLE commitments
    ADD COLUMN why VARCHAR(255) NULL,
    ADD COLUMN if_skipped VARCHAR(255) NULL;
