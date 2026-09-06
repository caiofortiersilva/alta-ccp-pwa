const fs = require('fs');
const path = require('path');

// Corrige o logo usado pelo gerador legado: o JPEG embutido nele estava cortado.
// Aqui substituímos ImageRun antes de carregar ./generate, usando o PNG completo
// extraído dos templates-mestre originais.
const docxPath = require.resolve('docx');
const docx = require(docxPath);
const OriginalImageRun = docx.ImageRun;
const fullLogo = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'ufc-logo.b64'), 'utf8').trim(),
  'base64'
);

class FullLogoImageRun extends OriginalImageRun {
  constructor(options = {}) {
    super({ ...options, data: fullLogo, type: 'png' });
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
