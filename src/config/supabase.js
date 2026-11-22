const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROL_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el archivo .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

module.exports = { supabase, supabaseAdmin };
