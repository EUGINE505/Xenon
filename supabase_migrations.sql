-- ============================================================
-- Xenon Code - run these in your Supabase SQL editor
-- ============================================================

-- Profile customisation upgrades
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_me TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_topic TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- 1. Class announcements (teacher -> students)
CREATE TABLE IF NOT EXISTS class_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage their own announcements" ON class_announcements;
CREATE POLICY "Teachers manage their own announcements"
  ON class_announcements FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students read announcements for their class" ON class_announcements;
CREATE POLICY "Students read announcements for their class"
  ON class_announcements FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM class_members WHERE student_id = auth.uid()
    )
  );

-- 2. Class assignments
CREATE TABLE IF NOT EXISTS class_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  question_goal INTEGER,
  due_date      DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Back-compat: if the table already existed from an older migration, ensure the column exists.
ALTER TABLE class_assignments ADD COLUMN IF NOT EXISTS question_goal INTEGER;

ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage their own assignments" ON class_assignments;
CREATE POLICY "Teachers manage their own assignments"
  ON class_assignments FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students read assignments for their class" ON class_assignments;
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

DROP POLICY IF EXISTS "Students manage their own submissions" ON assignment_submissions;
CREATE POLICY "Students manage their own submissions"
  ON assignment_submissions FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers read submissions for their assignments" ON assignment_submissions;
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

DROP POLICY IF EXISTS "Users read their own achievements" ON user_achievements;
CREATE POLICY "Users read their own achievements"
  ON user_achievements FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert their own achievements" ON user_achievements;
CREATE POLICY "Users insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. Student friendships
CREATE TABLE IF NOT EXISTS friendships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  responded_at  TIMESTAMPTZ,
  CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_pair
  ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view their friendships" ON friendships;
CREATE POLICY "Students view their friendships"
  ON friendships FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "Students send friendships" ON friendships;
CREATE POLICY "Students send friendships"
  ON friendships FOR INSERT
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Students update friendships" ON friendships;
CREATE POLICY "Students update friendships"
  ON friendships FOR UPDATE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "Students delete friendships" ON friendships;
CREATE POLICY "Students delete friendships"
  ON friendships FOR DELETE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- 6. Friend 1v1 challenge matches
CREATE TABLE IF NOT EXISTS friend_challenges (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status                       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined', 'cancelled')),
  question_titles              JSONB NOT NULL DEFAULT '[]'::jsonb,
  challenger_score             INTEGER NOT NULL DEFAULT 0,
  opponent_score               INTEGER NOT NULL DEFAULT 0,
  challenger_answers           INTEGER NOT NULL DEFAULT 0,
  opponent_answers             INTEGER NOT NULL DEFAULT 0,
  challenger_completed_at      TIMESTAMPTZ,
  opponent_completed_at        TIMESTAMPTZ,
  challenger_xp_awarded        BOOLEAN NOT NULL DEFAULT false,
  opponent_xp_awarded          BOOLEAN NOT NULL DEFAULT false,
  winner_id                    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at                 TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (challenger_id <> opponent_id)
);

ALTER TABLE friend_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view their own challenges" ON friend_challenges;
CREATE POLICY "Students view their own challenges"
  ON friend_challenges FOR SELECT
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

DROP POLICY IF EXISTS "Students create their own challenges" ON friend_challenges;
CREATE POLICY "Students create their own challenges"
  ON friend_challenges FOR INSERT
  WITH CHECK (challenger_id = auth.uid());

DROP POLICY IF EXISTS "Students update their own challenges" ON friend_challenges;
CREATE POLICY "Students update their own challenges"
  ON friend_challenges FOR UPDATE
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid())
  WITH CHECK (challenger_id = auth.uid() OR opponent_id = auth.uid());

DROP POLICY IF EXISTS "Students delete pending challenges they created" ON friend_challenges;
CREATE POLICY "Students delete pending challenges they created"
  ON friend_challenges FOR DELETE
  USING (challenger_id = auth.uid() AND status = 'pending');
