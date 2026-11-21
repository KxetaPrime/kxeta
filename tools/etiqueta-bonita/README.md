# Etiqueta Bonita

Página que troca a lista de produtos espremida no rodapé das etiquetas da Shopee
(PDF gerado pelo UpSeller, 10x15) por um quadro de conferência: quantidade grande,
SKU, nome curto do produto, variação em destaque e um quadradinho para riscar.

## Como usar
1. Baixe `Etiqueta-Bonita.html` e abra no navegador (Chrome/Edge). Funciona offline.
2. No UpSeller, gere as etiquetas do dia e baixe o PDF.
3. Arraste o PDF para a página, confira a prévia e clique em **Baixar PDF pronto**.
4. Imprima na térmica em 100 x 150 mm, escala 100%.

Pedidos com muitos itens que não cabem no rodapé ganham uma etiqueta extra de lista logo depois.
Os dados dos pedidos não saem do computador.

## Manutenção
- Regras de nome curto e SKU: lista `RULES` em `template.html`.
- Para gerar de novo o arquivo único: `npm i pdfjs-dist@3.11.174 pdf-lib@1.17.1 && python3 build.py`.
