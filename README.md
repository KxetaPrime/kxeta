# Nova Prime 3D

Site vitrine estático da Nova Prime 3D (HTML/CSS/JS, sem build): peças impressas em 3D, filamentos e projetos sob medida.
Os pedidos são finalizados pelo WhatsApp. Para ver, abra `index.html` no navegador.

## Estrutura
- `index.html`: página
- `css/style.css`: estilos antigos ainda usados pelos modais; `css/site.css`: visual atual
- `js/app.js`: catálogo, carrinho, preços, promoção e WhatsApp
- `js/home.js`: hero em carrossel, destaques, favoritos
- `js/filaments.js`: cards de marca e janela de filamentos
- `data/products.json` / `products.js`: produtos impressos (vindos das planilhas da Shopee)
- `data/filaments.js`: filamentos (gerado por `tools/build_filaments.py`)
- `data/promo.js`: promoção (nome, % e datas)
- `assets/products/`: fotos dos produtos (inclui uma foto por opção: `*-op-*.webp`)
- `assets/filamentos/studio/`: fotos dos filamentos no fundo de estúdio
- `tools/studio.py`: tratamento das fotos dos filamentos; `tools/build_filaments.py`: catálogo de filamentos
- `logo/`: propostas de logotipo; `higgsfield/prompts.md`: prompts para gerar vídeo/imagem

## Tarefas comuns
- **Preço/estoque dos filamentos:** edite `CATALOGO` em `tools/build_filaments.py` e rode `python3 tools/build_filaments.py`.
  Preço = custo + R$ 20 (varejo), + R$ 15 a partir de 6 carretéis, + R$ 10 a partir de 21; termina sempre em ,99.
- **Promoção:** edite `data/promo.js` (ou `window.NP_PROMO = null` para desligar).
- **Produtos impressos:** exporte as planilhas da Shopee e atualize `data/products.json`, depois regenere o `.js`:

```bash
python3 -c "import json;d=json.load(open('data/products.json'));open('data/products.js','w').write('window.NP_PRODUCTS = '+json.dumps(d,ensure_ascii=False,indent=1)+';\\n')"
```

## Publicar
Qualquer hospedagem estática (GitHub Pages, Netlify, Vercel): publique a raiz do repositório.
