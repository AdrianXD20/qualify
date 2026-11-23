-- ============================================================
-- 001: disponibilidad del cuidador + ubicaciones aproximadas
-- Ejecutar en Supabase > SQL Editor antes de desplegar.
-- ============================================================

-- 1. Estado de disponibilidad del cuidador (toggle manual)
ALTER TABLE cuidadores
  ADD COLUMN IF NOT EXISTS disponible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disponible_desde timestamptz;

-- 2. Última ubicación aproximada de cuidadores libres
--    (una fila por cuidador, sin historial)
CREATE TABLE IF NOT EXISTS ubicaciones_libres (
  cuidador_id integer PRIMARY KEY REFERENCES cuidadores(id) ON DELETE CASCADE,
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  precision_metros double precision NOT NULL DEFAULT 200,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_libres_actualizado
  ON ubicaciones_libres (actualizado_en DESC);

-- 3. RLS sin políticas: solo el backend (service role) puede acceder.
--    Así las coordenadas no quedan expuestas con la anon key.
ALTER TABLE ubicaciones_libres ENABLE ROW LEVEL SECURITY;
