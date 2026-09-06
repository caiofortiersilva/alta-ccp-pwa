const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const docx = require('docx');

// Substitui a mídia do brasão dentro do pacote DOCX antes de devolvê-lo.
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
  const media = Object.keys(zip.files).filter(
    name => /^word\/media\//i.test(name) && !zip.files[name].dir
  );

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

function parseBody(body) {
  if (body == null) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body;
}

module.exports = async (req, res) => {
  const originalBody = parseBody(req.body);

  // O backend principal espera:
  // { payload: { hoje, pacientes }, recipient }
  // Aceitamos tanto esse formato quanto o formato direto do frontend:
  // { hoje, pacientes, recipient }
  if (originalBody && originalBody.payload) {
    req.body = originalBody;
  } else if (originalBody) {
    req.body = {
      payload: {
        hoje: originalBody.hoje,
        pacientes: originalBody.pacientes
      },
      recipient: originalBody.recipient
    };
  } else {
    req.body = originalBody;
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
