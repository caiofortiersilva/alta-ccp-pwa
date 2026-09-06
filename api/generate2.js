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
