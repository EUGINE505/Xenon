-- ============================================================
-- Xenon Code — Multi-teacher / co-teacher migration
-- Run this in your Supabase SQL editor to enable:
--   • One teacher owning multiple classes
--   • Multiple teachers sharing a single class
-- ============================================================

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS class_teachers (
  class_id   uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  timestamptz DEFAULT now(),
  PRIMARY KEY (class_id, teacher_id)
);

-- 2. Enable Row Level Security
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- 3. Policies ─ teachers can see their own rows
CREATE POLICY "class_teachers_select"
  ON class_teachers FOR SELECT
  USING (teacher_id = auth.uid());

-- 4. Teachers can join a class (insert themselves)
CREATE POLICY "class_teachers_insert"
  ON class_teachers FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- 5. A teacher can leave, or the class owner can remove anyone
CREATE POLICY "class_teachers_delete"
  ON class_teachers FOR DELETE
  USING (
    teacher_id = auth.uid()
    OR class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- 6. Backfill every existing class so the owner appears in class_teachers
INSERT INTO class_teachers (class_id, teacher_id, joined_at)
SELECT id, teacher_id, created_at FROM classes
ON CONFLICT (class_id, teacher_id) DO NOTHING;
