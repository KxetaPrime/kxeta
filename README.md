# Nova Prime 3D

Site vitrine da Nova Prime 3D: filamentos Flashforge, peças impressas em 3D e projetos sob medida.
Pedidos são finalizados pelo WhatsApp. Site estático, sem build: basta abrir `index.html`.

## Estrutura
- `index.html`: página
- `css/style.css`: estilos
- `js/app.js`: catálogo, carrinho e WhatsApp
- `data/products.json`: produtos (fonte de verdade para edição)
- `data/products.js`: mesma lista em formato JS, lida pelo site
- `assets/`: imagens locais

## Atualizar produtos, preços e estoque
Edite `data/products.json` e regenere o `.js`:

```bash
python3 -c "import json;d=json.load(open('data/products.json'));open('data/products.js','w').write('window.NP_PRODUCTS = '+json.dumps(d,ensure_ascii=False,indent=1)+';\n')"
```

## Publicar
Qualquer hospedagem estática serve (GitHub Pages, Netlify, Vercel): publique a raiz do repositório.
