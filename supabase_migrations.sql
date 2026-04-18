-- ============================================================
-- Xenon Code – run these in your Supabase SQL editor
-- ============================================================

-- 1. Class announcements (teacher → students)
CREATE TABLE IF NOT EXISTS class_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their own announcements"
  ON class_announcements FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students read announcements for their class"
  ON class_announcements FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE student_id = auth.uid()
    )
  );

-- 2. Class assignments
CREATE TABLE IF NOT EXISTS class_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their own assignments"
  ON class_assignments FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students read assignments for their class"
  ON class_assignments FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE student_id = auth.uid()
    )
  );

-- 3. Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  UUID NOT NULL REFERENCES class_assignments(id) ON DELETE CASCADE,
  class_id       UUID NOT NULL REFERENCES classes(id)           ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES profiles(id)          ON DELETE CASCADE,
  notes          TEXT DEFAULT '',
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own submissions"
  ON assignment_submissions FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers read submissions for their assignments"
  ON assignment_submissions FOR SELECT
  USING (
    assignment_id IN (
      SELECT id FROM class_assignments WHERE teacher_id = auth.uid()
    )
  );

-- 4. User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own achievements"
  ON user_achievements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());
