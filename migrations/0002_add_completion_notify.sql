-- Track when instructor was notified of a learner's completion
ALTER TABLE learners ADD COLUMN completion_notified_at TEXT;
