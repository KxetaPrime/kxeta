# Ads, busca orgânica e impulsão de vendas — Shopee

Duas alavancas de tráfego: **pago** (Shopee Ads, módulo `/api/v2/ads/`) e **orgânico** (ranqueamento na busca e nos feeds). As duas se cruzam pela **palavra-chave**: o que o comprador digita é o que você quer no título (orgânico) E no lance (pago).

Specs oficiais confirmadas via a receita da SKILL.md §3.

---

## PARTE 1 — Shopee Ads (tráfego pago)

### Onde o anúncio aparece: placement
`campaign_placement`: **`search`** (resultado de busca, quando o comprador digita um termo — intenção alta) · **`discovery`** (feeds "Daily Discover", "You May Also Like" — descoberta, intenção baixa) · **`all`**. Search converte melhor por clique; discovery dá volume/alcance. Para primeiras vendas/reviews, **search** costuma valer mais.

### Lance: automático (ROAS) vs manual (por palavra-chave)
- **`bidding_method: auto`** — você define `roas_target` e a Shopee bida sozinha para atingi-lo. `roas_target = 0` → **GMV Max** (maximiza faturamento sem alvo). É o que o `ShopeeCreateAds` usa hoje.
- **`bidding_method: manual`** — você escolhe as palavras e o lance por clique (`edit_manual_product_ad_keywords`). Controle fino, mais trabalho.

### 🎯 ROAS alvo — use a recomendação OFICIAL, não só o breakeven
`get_product_recommended_roi_target(item_id, reference_id)` devolve **`lower_bound` / `exact` / `upper_bound`**, cada um com `value` (o ROAS) e `percentile` (competitividade vs. anúncios parecidos). 

**Como combinar com o nosso breakeven** (o piso que já calculamos por variação em `ShopeeCreateAds`): o alvo bom é `max(breakeven_com_folga, lower_bound_oficial)`. O breakeven garante que não dá prejuízo; a recomendação oficial garante que o alvo não está tão alto a ponto da Shopee não bidar (pouca impressão → poucas reviews). Alvo alto = ROAS protegido mas quase sem entrega; alvo baixo = muita entrega mas risco de prejuízo. O `percentile` diz onde você está nessa régua.

### Orçamento: recomendação oficial
`get_create_product_ad_budget_suggestion(product_selection, campaign_placement, bidding_method, ...)` → `recommended_budget` / `min_budget` / `max_budget`. Use o `min` para a fase de "comprar reviews barato"; o `recommended` quando o produto já provou conversão.

### Métricas: `direct_` vs `broad_` (a leitura honesta)
`get_all_cpc_ads_daily_performance` e `get_product_campaign_daily_performance` devolvem tudo em **dois sabores**:
- **`direct_*`** — o comprador clicou no anúncio E comprou **aquele mesmo item**. É a atribuição estrita e verdadeira do anúncio.
- **`broad_*`** — o comprador clicou e comprou **qualquer item** da loja em 7 dias. Infla o resultado (inclui venda que talvez fosse acontecer de qualquer jeito).

Campos: `impression`, `clicks`, `ctr`, `direct/broad_order`, `direct/broad_conversions`, `direct/broad_item_sold`, `direct/broad_gmv`, `expense`, `cost_per_conversion`, `direct/broad_roas`.

> **Regra de honestidade** (já no ERP): a atribuição inclui **impressão** ("participou", não "causou"). Ao dizer ao lojista "o anúncio trouxe X", use `direct_*` e diga que é limite superior. A venda da Isabelly (organic-looking numa campanha que mal gastou) é o caso clássico: `broad` atribuía, `direct` não.

### Toggles da conta de Ads: `get_shop_toggle_info`
- **`auto_top_up`** — recarga automática da carteira de Ads. Ligado = a Shopee debita sozinha quando o saldo acaba (o lojista **desligou** de propósito para controlar gasto).
- **`campaign_surge`** — a "Impulsão Rápida" / surge. Aumenta lances para pegar picos, mas **enfraquece a Proteção ROAS** (passa a mirar ~70% do alvo). Recomendação da Shopee que come dinheiro se ligada sem querer.

### Proteção ROAS (como funciona)
No lance automático, a Shopee "protege" o ROAS: se o anúncio não atingir o alvo, ela devolve crédito na carteira de Ads. **Precisa de ≥5 conversões/dia** para calibrar; abaixo disso não protege. `campaign_surge`/Impulsão Rápida derruba a proteção para 70% do alvo. O crédito cai na ads-wallet (não no payout de vendas — ver `financeiro.md`).

### GMS (GMV Max) — campanhas de faturamento
`check_create_gms_product_campaign_eligibility` → `create_gms_product_campaign` / `edit_gms_product_campaign`. Métricas em `get_gms_campaign_performance` / `get_gms_item_performance`. É o alvo `roas_target=0`: maximiza GMV. Bom quando o objetivo é volume (reviews, ranqueamento) e não margem imediata.

> `create_auto_product_ads` está **deprecado** ("coming offline soon") — sempre `create_manual_product_ads`.

---

## PARTE 2 — Palavras-chave (a ponte pago ↔ orgânico)

`get_recommended_keyword_list(item_id, input_keyword?)` é o endpoint mais valioso para vendas. Por item, devolve `suggested_keywords[]` com:
- **`keyword`** — o termo que o comprador realmente digita.
- **`search_volume`** — quantas vezes foi buscado na Shopee (**demanda real**, o sinal de ouro).
- **`quality_score`** — quão relevante/atraente seu anúncio é para aquele termo.
- **`suggested_bid`** — lance por clique sugerido pelo algoritmo.

**Isto alimenta as DUAS alavancas:**
1. **Orgânico:** ponha os termos de maior `search_volume` no **título** e nos atributos → você ranqueia de graça para o que as pessoas procuram. (É o que os comandos `shopee:sync-keywords` + `shopee:titulos` fazem.)
2. **Pago (search ads):** bida nesses termos com `edit_manual_product_ad_keywords`.

**Lance por palavra (`edit_manual_product_ad_keywords`):** `selected_keywords[]` com `edit_action` (add/delete/restore/update), `keyword`, `match_type` (**`exact`** = só a busca idêntica, converte melhor e mais barato · **`broad`** = variações, mais alcance), `bid_price_per_click`. `failed_edits[]` diz o que não entrou.

`get_recommended_item_list` — quais itens da loja a Shopee recomenda anunciar (candidatos com maior potencial).

---

## PARTE 3 — Busca orgânica: como ranquear sem pagar

A Shopee **não expõe API de ranqueamento**, mas os fatores são conhecidos e você controla quase todos. O ranking da busca orgânica é, na prática, uma soma de:

| Fator | Como mexer | Alavanca no ERP |
|---|---|---|
| **Relevância do termo** | termo de alto `search_volume` no título/atributos | `get_recommended_keyword_list` → `shopee:titulos` |
| **Histórico de vendas/conversão** | vender (nem que seja com Ads no começo) | Ads para as primeiras vendas |
| **Avaliações (nº + estrela)** | entregar bem + pedir review; Ads compra as 1ªs | fase de "comprar reviews" |
| **Preço competitivo** | promoção que ainda fecha após taxa | `ShopeeProductService` promoções |
| **Estoque disponível** | nunca zerar (sem estoque → despenca) | `update_stock` (seller_stock) |
| **Qualidade do anúncio** | imagens, descrição, atributos preenchidos | `add_item`/`update_item` |
| **Taxa/velocidade de resposta no chat** | responder rápido (a IA do chat ajuda) | `ShopeeChatService` + IA |
| **Envio no prazo (ship-on-time)** | despachar em ≤1 dia útil | fluxo de separação/etiqueta |
| **Saúde da conta / penalidades** | zero violação (multa derruba ranking) | módulo `AccountHealth` |
| **Frescor (listing novo)** | boost inicial da Shopee para anúncio novo | aproveitar a janela nova |
| **Boost/Impulsionar** | subir ao topo da categoria por 4h | `shopee:boost` (rodízio) |

**AccountHealth** (`/api/v2/account_health/`, 6 endpoints) mede penalidades/violações que **derrubam o ranking orgânico** — vale monitorar (`get_shop_penalty`, métricas de performance). Multa não é só susto: rebaixa a loja inteira na busca.

---

## PARTE 4 — Playbook de impulsão de vendas (a estratégia)

Sequência que o ERP já apoia, do lançamento à colheita orgânica:

1. **Palavras certas primeiro.** `get_recommended_keyword_list` por item → põe os termos de maior `search_volume` no título (`shopee:titulos`). Sem isso, nem Ads nem orgânico acham o produto.
2. **Ads para as primeiras vendas e reviews.** Alvo = `max(breakeven, lower_bound oficial)`, placement `search`, orçamento `min`. Objetivo desta fase: **avaliações**, não lucro. GMV Max se quiser volume.
3. **Boost em rodízio.** `shopee:boost` mantém 5 anúncios no topo da categoria, girando o catálogo (dura 4h cada). De graça.
4. **Promoção que fecha após a taxa.** Preço competitivo puxa conversão → conversão puxa ranking orgânico.
5. **Chat rápido (IA).** Taxa de resposta alta é fator de ranking e fecha venda. A IA do chat responde/rascunha.
6. **Colher o orgânico.** Com reviews + histórico de venda + termos certos, o anúncio ranqueia sozinho. **Aí desliga o Ads** (ou baixa muito) — o produto agora vende no orgânico, que é margem cheia. Foi exatamente a tese do lojista: "máximo de proveito nos anúncios pagos para ter avaliações e depois desligar o ADS".
7. **Vigiar a conta.** `AccountHealth` — uma penalidade derruba tudo que você construiu.

### Números que importam (e como ler)
- **ROAS** = retorno por real de anúncio. Use `direct_roas`. Abaixo do breakeven = prejuízo.
- **CTR** = cliques ÷ impressões. Baixo → título/imagem/preço ruins para aquele termo (mexer no anúncio, não no lance).
- **Conversão** = pedidos ÷ cliques. Baixa com CTR alto → o anúncio atrai mas a página não fecha (preço, avaliações, foto).
- **`search_volume`** = tamanho do mercado daquele termo. Termo sem volume não traz gente por mais que você bide.
- **`quality_score`** = sua relevância para o termo. Baixo → a Shopee cobra mais caro e mostra menos.
