const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const docx = require('docx');

// Estratégia definitiva para o brasão:
// deixamos o gerador montar o DOCX normalmente e, antes de devolvê-lo,
// substituímos o arquivo de imagem dentro do próprio pacote .docx.
// Assim evitamos incompatibilidades de ImageRun no WPS/Word móvel.
const fullLogoJpg = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'ufc-logo-jpg.b64'), 'utf8').trim(),
  'base64'
);
const fullLogoPng = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'ufc-logo-opaque.b64'), 'utf8').trim(),
  'base64'
);

const originalToBuffer = docx.Packer.toBuffer.bind(docx.Packer);
docx.Packer.toBuffer = async function patchedToBuffer(document) {
  const buffer = await originalToBuffer(document);
  const zip = await JSZip.loadAsync(buffer);
  const media = Object.keys(zip.files).filter(name => /^word\/media\//i.test(name) && !zip.files[name].dir);

  for (const name of media) {
    if (/\.jpe?g$/i.test(name)) {
      zip.file(name, fullLogoJpg);
    } else if (/\.png$/i.test(name)) {
      zip.file(name, fullLogoPng);
    }
  }

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
};

const generate = require('./generate');

module.exports = async (req, res) => {
  const originalBody = req.body;

  // Compatibilidade com o frontend atual, que envia
  // { hoje, recipient, pacientes } diretamente.
  if (originalBody && !originalBody.payload) {
    req.body = {
      payload: originalBody,
      recipient: originalBody.recipient
    };
  }

  // Mantém a mensagem de sucesso do frontend consistente.
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data && data.generated == null && data.patients != null) {
      data.generated = data.patients;
    }
    return originalJson(data);
  };

  return generate(req, res);
};
