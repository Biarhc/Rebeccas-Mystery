# Deploy do Rebecca's Mystery na Vercel (via GitHub)

Este projeto utiliza **Flask (Python)** no back-end (`app.py`) e HTML/CSS/JS estáticos no front-end, podendo ser publicado gratuitamente na **Vercel** conectado ao **GitHub**.

## Arquivos de Configuração Incluídos
- `requirements.txt` — Dependências Python (`Flask`).
- `vercel.json` — Configuração de roteamento serverless para `app.py`.

## Passo a Passo para Publicar

1. **Subir o projeto para o GitHub**
   - Crie um repositório no GitHub (ou use um existente).
   - Envie todos os arquivos do projeto, incluindo `app.py`, `requirements.txt`, `vercel.json`, `templates/`, `static/` e `data/`.

2. **Importar na Vercel**
   - Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
   - Clique em **Add New... > Project**.
   - Selecione o repositório do **Rebecca's Mystery** e clique em **Import**.

3. **Configurar e Publicar**
   - A Vercel detectará automaticamente o `vercel.json` e o `requirements.txt`.
   - Clique em **Deploy** e aguarde a conclusão.
   - Ao finalizar, a Vercel fornecerá o link público (`.vercel.app`) para jogar direto no navegador.

> **Nota sobre o Save:** Como servidores serverless na Vercel não mantêm arquivos gravados em disco, o progresso do jogador é salvo localmente no navegador (`localStorage`).
