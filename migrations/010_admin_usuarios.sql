ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN NOT NULL DEFAULT false;
UPDATE usuarios SET es_admin = true WHERE username = 'rhoover';
