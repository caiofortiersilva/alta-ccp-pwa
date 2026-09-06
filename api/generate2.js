const fs = require('fs');
const path = require('path');

// O gerador legado usa ImageRun para inserir o brasão da UFC.
// Para maximizar a compatibilidade com Word, Google Docs e WPS no celular,
// usamos uma versão JPEG do brasão completo sobre fundo branco.
const docxPath = require.resolve('docx');
const docx = require(docxPath);
const OriginalImageRun = docx.ImageRun;
const fullLogo = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'ufc-logo-jpg.b64'), 'utf8').trim(),
  'base64'
);

class FullLogoImageRun extends OriginalImageRun {
  constructor(options = {}) {
    super({ ...options, data: fullLogo, type: 'jpg' });
  }
}

// Faz com que o require('docx') dentro de ./generate receba a versão corrigida.
require.cache[docxPath].exports = { ...docx, ImageRun: FullLogoImageRun };

const generate = require('./generate');

module.exports = async (req, res) => {
  const originalBody = req.body;

  // O frontend legado envia { hoje, recipient, pacientes } diretamente.
  // O gerador interno usa { payload: {...}, recipient }.
  if (originalBody && !originalBody.payload) {
    req.body = {
      payload: originalBody,
      recipient: originalBody.recipient
    };
  }

  // Compatibilidade com a mensagem de sucesso do frontend.
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data && data.generated == null && data.patients != null) {
      data.generated = data.patients;
    }
    return originalJson(data);
  };

  return generate(req, res);
};
