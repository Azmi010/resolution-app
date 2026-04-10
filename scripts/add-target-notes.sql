-- Add target_notes table for flexible grouped notes per target
CREATE TABLE IF NOT EXISTS target_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_target_notes_target_id ON target_notes(target_id);

ALTER TABLE target_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own target notes" ON target_notes;
DROP POLICY IF EXISTS "Users can insert their own target notes" ON target_notes;
DROP POLICY IF EXISTS "Users can update their own target notes" ON target_notes;
DROP POLICY IF EXISTS "Users can delete their own target notes" ON target_notes;

CREATE POLICY "Users can view their own target notes" ON target_notes FOR SELECT USING (
  target_id IN (
    SELECT t.id FROM targets t
    INNER JOIN resolutions r ON t.resolution_id = r.id
    INNER JOIN years y ON r.year_id = y.id
    WHERE y.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own target notes" ON target_notes FOR INSERT WITH CHECK (
  target_id IN (
    SELECT t.id FROM targets t
    INNER JOIN resolutions r ON t.resolution_id = r.id
    INNER JOIN years y ON r.year_id = y.id
    WHERE y.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own target notes" ON target_notes FOR UPDATE USING (
  target_id IN (
    SELECT t.id FROM targets t
    INNER JOIN resolutions r ON t.resolution_id = r.id
    INNER JOIN years y ON r.year_id = y.id
    WHERE y.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own target notes" ON target_notes FOR DELETE USING (
  target_id IN (
    SELECT t.id FROM targets t
    INNER JOIN resolutions r ON t.resolution_id = r.id
    INNER JOIN years y ON r.year_id = y.id
    WHERE y.user_id = auth.uid()
  )
);
