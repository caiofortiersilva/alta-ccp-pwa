# Publicação do Alta CCP no Vercel

O frontend e a API ficam no mesmo projeto Vercel. O endpoint é `/api/generate` e recebe os dados do lote, gera os `.docx` em memória, compacta em ZIP, envia por e-mail e encerra a requisição sem salvar os dados em banco.

## 1. Importar o repositório

No Vercel:

1. Add New → Project
2. Importar `caiofortiersilva/alta-ccp-pwa`
3. Framework Preset: Other
4. Root Directory: `.`
5. Deploy

## 2. Variáveis de ambiente

Adicionar em Project Settings → Environment Variables, preferencialmente para Production e Preview:

- `APP_KEY` — chave privada usada pelo app para autorizar chamadas ao backend
- `PERSONAL_EMAIL` — e-mail pessoal autorizado
- `SERVICE_EMAIL` — e-mail do serviço autorizado
- `SMTP_HOST` — host SMTP do e-mail remetente
- `SMTP_PORT` — normalmente `587` (STARTTLS) ou `465` (SSL)
- `SMTP_USER` — usuário/conta remetente
- `SMTP_PASS` — senha SMTP ou senha de aplicativo
- `SMTP_FROM` — remetente exibido, normalmente igual ao `SMTP_USER`

### Exemplo Gmail

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=<conta remetente>`
- `SMTP_PASS=<senha de aplicativo do Google>`
- `SMTP_FROM=<conta remetente>`

Não use a senha normal da conta Google. Se optar por Gmail, use uma senha de aplicativo criada na própria conta Google com 2FA habilitada.

## 3. Chave do aplicativo

O valor de `APP_KEY` não deve ser salvo no GitHub. Depois de configurá-lo no Vercel, abra o app no celular, vá em **Configuração do aplicativo** e digite a mesma chave. Ela fica salva apenas no `localStorage` do aparelho.

## 4. Uso

No app:

1. Adicionar um ou mais pacientes à fila
2. Escolher `Meu e-mail`, `E-mail do serviço` ou `Ambos`
3. Tocar em **Gerar e enviar por e-mail**

O assunto do e-mail é genérico (`Documentos de Alta CCP`). Os dados clínicos ficam somente dentro dos documentos anexos.

## 5. Privacidade

O backend não usa banco de dados. Os arquivos são gerados em memória e anexados ao e-mail durante a própria requisição. Não há código de persistência dos dados do paciente.
