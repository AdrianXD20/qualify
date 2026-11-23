-- ============================================================
-- 002: direcciones en geocercas y ubicaciones en vivo
-- Ejecutar en Supabase > SQL Editor antes de usar los campos nuevos.
-- ============================================================

-- Dirección por partes para la zona segura / domicilio del paciente
ALTER TABLE geocercas
  ADD COLUMN IF NOT EXISTS calle_numero text,
  ADD COLUMN IF NOT EXISTS colonia text,
  ADD COLUMN IF NOT EXISTS codigo_postal text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS pais text DEFAULT 'México',
  ADD COLUMN IF NOT EXISTS direccion_formateada text;

-- Dirección legible de la última ubicación del cuidador libre.
-- Se actualiza como máximo cada 5 minutos para respetar el límite de Nominatim.
ALTER TABLE ubicaciones_libres
  ADD COLUMN IF NOT EXISTS direccion_formateada text,
  ADD COLUMN IF NOT EXISTS direccion_actualizada_en timestamptz;
