CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_player_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_rooms_code ON rooms (code);
CREATE INDEX idx_rooms_status ON rooms (status);

CREATE TABLE IF NOT EXISTS game_events (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id),
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_events_room_id ON game_events (room_id);
CREATE INDEX idx_game_events_type ON game_events (event_type);
