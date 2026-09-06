# Papelada CCP — HUWC

PWA instalável no celular para montar um lote de pacientes, gerar os documentos de **admissão** do serviço de Cirurgia de Cabeça e Pescoço do HUWC e enviá-los por e-mail.

## O que esta versão já faz

- Formulário mobile: nome, prontuário, sexo, procedimento, lateralidade e data da cirurgia.
- Lista em lote com edição e exclusão.
- Geração automática de dois DOCX por paciente:
  - `Termo_Consentimento_<Nome>.docx`
  - `Protocolo_TEV_<Nome>.docx`
- Usa os templates reais fornecidos para o Termo e o TEV.
- No Termo, preenche nome, prontuário, procedimento, data da cirurgia e riscos/complicações.
- No TEV, preenche nome, prontuário, sexo e a **data da geração**, deixando a avaliação clínica em branco.
- Agrupa o lote em `Admissoes_CCP_DD-MM-AAAA.zip`.
- Envia o ZIP por e-mail.
- Não inclui nome, prontuário ou procedimento no assunto/corpo do e-mail.
- Não usa banco de dados. A lista de pacientes fica apenas na sessão atual do navegador/PWA.
- Pode ser instalado como aplicativo no Android após publicação em HTTPS.

## Estrutura

```text
papelada_ccp_pwa/
├── index.html
├── manifest.webmanifest
├── sw.js
├── vercel.json
├── pyproject.toml
├── .env.example
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── templates/
│   ├── termo_consentimento_template.docx
│   └── protocolo_tev_template.docx
└── api/
    └── generate.py
```

## Envio de e-mail

Há duas opções. O backend escolhe conforme `EMAIL_PROVIDER`.

### A. SMTP — caminho mais simples

Pode ser usado com Gmail, Google Workspace ou SMTP institucional. Para Gmail/Workspace com autenticação em duas etapas, use uma **senha de app**, nunca a senha normal da conta.

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=conta-remetente@gmail.com
SMTP_APP_PASSWORD=senha-de-app
EMAIL_FROM=Papelada CCP <conta-remetente@gmail.com>
```

### B. Resend

Útil quando houver domínio próprio/verificado para o remetente.

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Papelada CCP <documentos@seu-dominio.com>
```

## Variáveis de segurança recomendadas

```env
APP_ACCESS_KEY=uma-chave-longa-e-aleatoria
ALLOWED_DESTINATION_EMAILS=email1@exemplo.com,email2@exemplo.com
APP_TIMEZONE=America/Fortaleza
```

`ALLOWED_DESTINATION_EMAILS` é importante: mesmo que alguém descubra a URL do app, o servidor só enviará os documentos para os endereços autorizados.

## Publicar no Vercel

1. Crie um repositório privado no GitHub e coloque esta pasta na raiz.
2. No Vercel, crie um projeto importando esse repositório.
3. Em **Settings → Environment Variables**, copie as variáveis necessárias do `.env.example`.
4. Faça o deploy.
5. Abra a URL HTTPS gerada pelo Vercel.
6. No app, informe uma vez:
   - o e-mail de destino autorizado;
   - a mesma `APP_ACCESS_KEY` configurada no Vercel.
7. Gere um lote de teste sem dados reais antes de usar na rotina.

O backend é uma Function Python e não depende de banco de dados nem de bibliotecas Python externas para gerar os DOCX.

## Instalar no Android

Após o deploy:

1. Abra a URL do app no Chrome.
2. Toque em **Instalar app** quando o botão aparecer; ou use o menu do Chrome → **Adicionar à tela inicial / Instalar app**.
3. O app passará a abrir em uma janela própria, como um aplicativo comum.

## Privacidade e uso clínico

Este projeto manipula dados pessoais e dados de saúde. Antes de uso rotineiro com pacientes reais:

- prefira e-mail institucional ou outro fluxo aprovado pelo serviço;
- mantenha `ALLOWED_DESTINATION_EMAILS` restrito;
- use uma `APP_ACCESS_KEY` forte;
- mantenha o repositório privado;
- não grave dados dos pacientes em logs;
- valide o fluxo conforme as regras internas do HUWC/EBSERH e a LGPD.

O aplicativo foi propositalmente construído **sem banco de dados**. O servidor recebe o lote, gera os arquivos, envia o e-mail e não possui código para persistir os dados em banco.

## Biblioteca de riscos/complicações

A lista de tireoidectomia foi baseada no Termo fornecido. Há também listas iniciais para parotidectomia, esvaziamento cervical, traqueostomia, laringectomia, glossectomia, mandibulectomia e ressecções de cavidade oral, além de um fallback genérico.

**Antes de uso assistencial**, as listas dos procedimentos que ainda não foram formalmente validadas pelo serviço devem ser revisadas e aprovadas. Elas ficam no arquivo `api/generate.py`, no dicionário `COMPLICATIONS`.

## Limites atuais

- Até 12 pacientes por lote.
- O envio requer internet.
- O PWA pode abrir offline, mas não consegue gerar/enviar documentos sem conexão.
- O app não preenche avaliação de risco do TEV; esses campos permanecem manuais.
- A função de alta ainda não foi incorporada nesta versão.
