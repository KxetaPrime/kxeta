#!/usr/bin/env python3
"""Pesquisa produtos na Shopee pela API de Afiliados (Brasil).

Lê as chaves das variáveis de ambiente SHOPEE_AFF_APP_ID e SHOPEE_AFF_SECRET.
Nunca coloque as chaves neste arquivo.

Uso:
    python3 tools/shopee_afiliados.py "chaveiro nossa senhora aparecida"
    python3 tools/shopee_afiliados.py "letreiro feliz natal" --limite 30 --ordem vendas
    python3 tools/shopee_afiliados.py "porta ampolas" --csv saida.csv
"""

import argparse
import csv
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request

ENDPOINT = "https://open-api.affiliate.shopee.com.br/graphql"

# Valores de sortType da productOfferV2: 1 relevância, 2 mais vendidos,
# 3 maior preço, 4 menor preço, 5 maior comissão.
ORDENS = {"relevancia": 1, "vendas": 2, "preco_maior": 3, "preco_menor": 4, "comissao": 5}

CONSULTA = """
query Busca($keyword: String, $sortType: Int, $page: Int, $limit: Int) {
  productOfferV2(keyword: $keyword, sortType: $sortType, page: $page, limit: $limit) {
    nodes {
      itemId
      productName
      shopName
      priceMin
      priceMax
      sales
      ratingStar
      commissionRate
      productLink
    }
    pageInfo { page limit hasNextPage }
  }
}
"""


def chamar(app_id, secret, consulta, variaveis):
    payload = json.dumps({"query": consulta, "variables": variaveis}, separators=(",", ":"))
    timestamp = str(int(time.time()))
    assinatura = hashlib.sha256((app_id + timestamp + payload + secret).encode()).hexdigest()
    pedido = urllib.request.Request(
        ENDPOINT,
        data=payload.encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"SHA256 Credential={app_id}, Timestamp={timestamp}, Signature={assinatura}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(pedido, timeout=30) as resposta:
            return json.loads(resposta.read().decode())
    except urllib.error.HTTPError as erro:
        sys.exit(f"Erro HTTP {erro.code}: {erro.read().decode()[:500]}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("palavra", help="termo de busca, como o comprador digitaria")
    parser.add_argument("--ordem", choices=ORDENS, default="vendas")
    parser.add_argument("--limite", type=int, default=20)
    parser.add_argument("--pagina", type=int, default=1)
    parser.add_argument("--csv", help="salvar o resultado neste arquivo CSV")
    args = parser.parse_args()

    app_id = os.environ.get("SHOPEE_AFF_APP_ID")
    secret = os.environ.get("SHOPEE_AFF_SECRET")
    if not app_id or not secret:
        sys.exit("Defina SHOPEE_AFF_APP_ID e SHOPEE_AFF_SECRET nas variáveis do ambiente.")

    dados = chamar(app_id, secret, CONSULTA, {
        "keyword": args.palavra,
        "sortType": ORDENS[args.ordem],
        "page": args.pagina,
        "limit": args.limite,
    })
    if dados.get("errors"):
        sys.exit("A API recusou a consulta: " + json.dumps(dados["errors"], ensure_ascii=False)[:800])

    produtos = dados["data"]["productOfferV2"]["nodes"]
    if not produtos:
        sys.exit("Nenhum produto encontrado para essa busca.")
    # A ordem "mais vendidos" da API é aproximada; reordena pelo número de vendas.
    if args.ordem == "vendas":
        produtos.sort(key=lambda p: int(p.get("sales") or 0), reverse=True)
    for posicao, p in enumerate(produtos, 1):
        preco = p["priceMin"] if p["priceMin"] == p["priceMax"] else f'{p["priceMin"]}-{p["priceMax"]}'
        print(f'{posicao:>2}. {p["sales"]:>7} vendidos | R$ {preco:<13} | nota {p["ratingStar"]} | '
              f'{p["shopName"]} | {p["productName"]}')

    if args.csv:
        with open(args.csv, "w", newline="", encoding="utf-8") as arquivo:
            escritor = csv.DictWriter(arquivo, fieldnames=list(produtos[0].keys()))
            escritor.writeheader()
            escritor.writerows(produtos)
        print(f"\nSalvo em {args.csv}")


if __name__ == "__main__":
    main()
