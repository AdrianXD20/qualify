const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROL_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el archivo .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente con service role: se usa del lado del servidor para saltar RLS.
// La autorización real la hace el middleware de JWT de la API.
const supabaseAdmin =
  supabaseServiceKey && supabaseServiceKey.length > 20
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

if (!supabaseAdmin) {
  console.warn(
    '⚠️  SUPABASE_SERVICE_ROLE_KEY no configurada o inválida. ' +
      'La API usará la anon key y las operaciones con RLS fallarán.'
  );
}

// Cliente de datos: preferimos service role (backend de confianza).
const db = supabaseAdmin || supabase;

module.exports = { supabase, supabaseAdmin, db };
