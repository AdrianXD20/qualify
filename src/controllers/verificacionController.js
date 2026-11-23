const { supabase, supabaseAdmin } = require('../config/supabase');
const { esquemaSubirDocumentos, esquemaRevisar } = require('../models/Verificacion');

async function subirDocumentos(req, res) {
  try {
    const { error: valError } = esquemaSubirDocumentos.validate(req.body);
    if (valError) return res.status(400).json({ error: valError.details[0].message });

    const { cuidador_id } = req.body;

    if (!req.files || !req.files.archivo_ine || !req.files.archivo_selfie) {
      return res.status(400).json({ error: 'Debes enviar archivo_ine y archivo_selfie' });
    }

    const { archivo_ine, archivo_selfie } = req.files;

    const rutaINE = `cuidadores/${cuidador_id}/ine_${Date.now()}.jpg`;
    const rutaSelfie = `cuidadores/${cuidador_id}/selfie_${Date.now()}.jpg`;

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurada' });
    }

    await supabaseAdmin.storage.from('documentos-cuidadores').upload(rutaINE, archivo_ine.buffer);
    await supabaseAdmin.storage.from('documentos-cuidadores').upload(rutaSelfie, archivo_selfie.buffer);

    const { data: urlINE } = await supabaseAdmin.storage
      .from('documentos-cuidadores')
      .createSignedUrl(rutaINE, 604800);

    const { data: urlSelfie } = await supabaseAdmin.storage
      .from('documentos-cuidadores')
      .createSignedUrl(rutaSelfie, 604800);

    const { error } = await supabaseAdmin
      .from('verificaciones_cuidador')
      .upsert({
        cuidador_id,
        estado: 'pendiente',
        documento_ine_url: urlINE.signedUrl,
        selfie_url: urlSelfie.signedUrl,
      });

    if (error) throw error;

    res.json({ mensaje: 'Documentos subidos. En revisión manual.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function revisar(req, res) {
  try {
    const { error: valError } = esquemaRevisar.validate(req.body);
    if (valError) return res.status(400).json({ error: valError.details[0].message });

    const { verificacion_id, estado, motivo_rechazo } = req.body;
    const admin_id = req.usuario.id;

    const { data: verif } = await supabaseAdmin
      .from('verificaciones_cuidador')
      .select('cuidador_id')
      .eq('id', verificacion_id)
      .single();

    if (!verif) {
      return res.status(404).json({ error: 'Verificación no encontrada' });
    }

    const { error } = await supabaseAdmin
      .from('verificaciones_cuidador')
      .update({
        estado,
        motivo_rechazo: estado === 'rechazado' ? motivo_rechazo : null,
        revisado_por: admin_id,
        revisado_en: new Date().toISOString(),
      })
      .eq('id', verificacion_id);

    if (error) return res.status(400).json({ error: error.message });

    if (estado === 'aprobado') {
      await supabaseAdmin
        .from('cuidadores')
        .update({ verificado: true })
        .eq('id', verif.cuidador_id);
    }

    res.json({ mensaje: `Verificación ${estado}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listarPendientes(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('verificaciones_cuidador')
      .select('*, cuidadores(*), usuarios(*)')
      .eq('estado', 'pendiente');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { subirDocumentos, revisar, listarPendientes };
