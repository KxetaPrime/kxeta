---
name: shopee-especialista
description: >
  Especialista na Shopee Open Platform API v2 para este ERP (gigacalc). Use SEMPRE
  que a tarefa envolver a Shopee: pedidos, escrow/taxas, produtos/anúncios, promoções,
  Shopee Ads (ROAS, keywords, orçamento, GMS), busca orgânica e impulsão de vendas,
  conciliação de contas a receber (o que a Shopee promete vs. o que cai na carteira:
  escrow/payout/wallet), chat (sellerchat), logística/etiquetas, NF-e, boost/impulsionar,
  webhooks (live push), OAuth/tokens, retornos, FBS/SBS, AMS (afiliados), ou mascaramento.
  Traz: a RECEITA para puxar a doc OFICIAL de qualquer endpoint sob demanda, o índice dos
  443 endpoints (endpoints.md), o guia de Ads+orgânico (ads.md), o de conciliação
  financeira (financeiro.md), a fórmula de assinatura, o mapa do código e o LEDGER DE
  PEGADINHAS já descobertas na marra. Consulte antes de qualquer chamada nova à Shopee.
metadata:
  type: reference
---

# Shopee Especialista — Open Platform API v2

Especialista na Shopee Open Platform API v2, foco **Brasil**. Preencha com os dados da sua loja: `shop_id`, `partner_id` do app, e o `purpose` do app (ex.: `orders`). Guarde a `partner_key` e os tokens fora do repositório (env/secret) — nunca no código versionado.

**Duas fontes, nesta ordem de autoridade:**
1. **Este código** — cada endpoint aqui foi chamado contra a API real e validado (às vezes ao vivo nesta sessão). Quando o código e um doc divergirem, **o código vence** (reflete o que a API BR de verdade respondeu).
2. **A doc OFICIAL da Shopee** — acessível via a API interna do portal (ver §3). Use-a para o que o código ainda não cobriu: parâmetros exatos, response sample, rate limit, campos novos.

> O SDK `congminh1254/shopee-sdk` é **de comunidade, não oficial** — ignore-o; temos acesso direto ao oficial.

---

## 1. Onde cada coisa vive (mapa do código)

Toda a integração está em `app/Services/Shopee/` + jobs + controllers. **Antes de criar método novo, procure aqui — quase tudo já existe.**

| Serviço | Arquivo | Cobre |
|---|---|---|
| Núcleo / OAuth / pedidos / escrow / NF upload | `app/Services/Shopee/ShopeeService.php` | token (`tokenFor`, `publicSign`, `shopSign`), `orderList`, `orderDetails`, `escrowDetail`, `uploadInvoiceXml` |
| Importador de pedidos | `app/Services/Shopee/ShopeeOrderImporter.php` | `STATUS_MAP`, `STATUS_RANK`, `syncExisting`, `customer()`, `fiscalAndLogistics()`, mascaramento |
| Produtos / anúncios / promoções / **boost** | `app/Services/Shopee/ShopeeProductService.php` | `items`, `details`, `models`, CRUD item/preço/estoque, promoções, **`boostedItems`/`boostItems`** |
| Shopee Ads (CPC) | `app/Services/Shopee/ShopeeAdsService.php` | `balance`, `campaignIds`, `campaignProducts`, `dailySpend` |
| Chat (sellerchat) | `app/Services/Shopee/ShopeeChatService.php` | `conversations`, `messages`, `sendText`, `isFromShop`, `textOf` |
| Logística/etiqueta | `app/Jobs/PrepareShopeeShipment.php` | create/download shipping document, tracking |

**Jobs (disparados por webhook):** `ImportShopeeOrder`, `PrepareShopeeShipment`, `RespondShopeeChat`.
**Comandos:** `app/Console/Commands/Shopee*.php` (`import`, `refresh-financials`, `sync-ads`, `criar-ads`, `sync-keywords`, `titulos`, **`boost`**, `diagnose-masking`).
**Webhooks:** `IntegrationController::webhookShopee`. **Telas:** `resources/views/admin/erp/{pedidos,anuncios,ads,chat}/`.

---

## 2. Autenticação e assinatura (a base de tudo)

**Host produção:** `https://partner.shopeemobile.com` — **sandbox:** `https://partner.test-stable.shopeemobile.com` (`ShopeeService::host()` decide por `app->is_sandbox`).

**HMAC-SHA256**, chave = `partner_key`. A base muda conforme o endpoint:

```
# Públicos (auth, token, refresh — SEM access_token/shop):
base = partner_id + path + timestamp
# De loja (a maioria):
base = partner_id + path + timestamp + access_token + shop_id
sign = hash_hmac('sha256', base, partner_key)
```

`path` é o caminho puro (`/api/v2/order/get_order_detail`), **sem** query string. `timestamp` = epoch em segundos, e vai TAMBÉM na query. Query de loja: `partner_id, timestamp, access_token, shop_id, sign` + params. Assinar com a query na base → `error_sign`.

**OAuth / token:** `/api/v2/shop/auth_partner` (autorização) → callback com `?code=&shop_id=` → `/api/v2/auth/token/get` (⚠️ nome é `get_access_token`, path é esse) devolve `access_token`+`refresh_token`. Renova por `/api/v2/auth/access_token/get`. **access_token dura 4h** (`tokenFor()` renova sozinho); refresh_token roda a cada uso.

---

## 3. 🔑 RECEITA — puxar a doc OFICIAL de qualquer endpoint (sob demanda)

O portal `open.shopee.com` bloqueia WebFetch, MAS o **`curl` do servidor alcança**, e a doc vem de uma API JSON interna (`/opservice/api/v1/`). Isto substitui adivinhar parâmetros — **sempre confirme aqui antes de escrever chamada nova**:

```bash
# Árvore completa do menu lateral (30 módulos, 443 endpoints):
curl -s -A "Mozilla/5.0" "https://open.shopee.com/opservice/api/v1/doc/module/?version=2"

# Spec COMPLETA de um endpoint (params, response_sample, path, method, rate_limit, errors):
curl -s -A "Mozilla/5.0" "https://open.shopee.com/opservice/api/v1/doc/api/?version=2&api_name=v2.order.get_order_detail"

# Webhooks: categorias e o payload real de cada push (campo push_code = o 'code' do corpo):
curl -s -A "Mozilla/5.0" "https://open.shopee.com/opservice/api/v1/push/category"
curl -s -A "Mozilla/5.0" "https://open.shopee.com/opservice/api/v1/push/doc?push_api_id=1&version=2"
```

No detalhe do endpoint: `path` e `url` (o endpoint real), `is_get_method` (0=POST, 1=GET), `params` (JSON string — decodifique), `response_sample`, `rate_limit`, `error_list`.

**Arquivos de referência (mesma pasta):**
- [`endpoints.md`](endpoints.md) — índice completo: 443 endpoints em 29 módulos, com `[✓ repo]` no que já usamos.
- [`ads.md`](ads.md) — **especialista em Ads + busca orgânica + impulsão de vendas**: ROAS oficial (`get_product_recommended_roi_target`), orçamento sugerido, palavras-chave (`search_volume`/`quality_score` — a ponte pago↔orgânico), placements search/discovery, métricas `direct_` vs `broad_`, toggles (`auto_top_up`/`campaign_surge`), Proteção ROAS, fatores de ranqueamento orgânico e o playbook de vendas.
- [`financeiro.md`](financeiro.md) — **especialista em conciliação de contas a receber**: provar que o que caiu na carteira == o que a Shopee prometeu. Três camadas (escrow → payout → wallet), a equação `payout_amount == Σ escrow + Σ ajustes`, e a receita do comando `shopee:conciliar`.

---

## 4. Módulos disponíveis (resumo — detalhe em `endpoints.md`)

29 módulos oficiais. Os grandes: **Product (58), Logistics (46), AMS/afiliados (36), GlobalProduct (34), Ads (25), Livestream (25), Order (22), Payment (18), FirstMile (16), Returns (15), Video (15)**. Menores: Discount (12), BrandPortal (11), ShopFlashSale (11), Bundle/Add-On Deal, Shop, ShopCategory, Merchant, Voucher, MediaSpace, Media, Follow Prize, AccountHealth, Public, TopPicks, SBS (5), FBS (4), Push (4).

**`sellerchat` (chat) NÃO está no menu oficial** mas funciona em produção (validado ao vivo) — ver `endpoints.md`.

Já usados e validados neste ERP: Order (list/detail/upload_invoice_doc), Payment (escrow), Product (CRUD + boost), Discount (promoções), Ads (campanhas/gasto), Logistics (etiqueta/tracking), SellerChat, Auth/Shop.

---

## 5. LEDGER DE PEGADINHAS (o mais valioso — cada uma custou horas)

Quebram **silenciosamente** ou com erro genérico. Confie nesta lista antes de "descobrir" de novo. **Ao achar uma nova, adicione aqui.**

### Pedidos / escrow / fiscal
- **Taxa = SOMA dos componentes do escrow** (commission + service + transaction + ads + campaign), **NUNCA** `buyer_total − escrow` (inclui frete do comprador e infla). Validado ao centavo. `get_escrow_detail`.
- **`pay_time` é o filtro de venda real.** Sem `pay_time`, nunca foi pago → **não importar** (senão lança custo de filamento como prejuízo fantasma). Status não filtra (reembolso pós-pagamento é venda real).
- **Mascaramento por janela:** nome/CPF/endereço limpos só em `READY_TO_SHIP`. Depois da coleta, remascara (`A******s`). **Telefone SEMPRE mascarado.** `unmasked()` devolve `null` se veio com `*`.
- **`response_optional_fields`** precisa listar explicitamente cada campo (`pay_time`, `invoice_data`, `package_list`, `buyer_cpf_id`, `buyer_user_id`, `recipient_address`). Não pedido = ausente.
- **`get_buyer_invoice_info` só existe VN/TH/PH — BR não expõe** dados por essa rota; use a janela de mascaramento.
- **Frete do vendedor sai do escrow; `actual_shipping_fee` é do programa de frete da Shopee**, não do vendedor → `shipping_cost = 0`.
- **Status só ANDA PARA FRENTE** (`STATUS_RANK`): push atrasado de `READY_TO_SHIP` não desfaz "Separação"/"Impresso". Cancelamento é exceção. `TO_CONFIRM_RECEIVE`/`COMPLETED` → `delivered`.
- **`get_order_list` filtra por data de CRIAÇÃO — não serve de rede de segurança para mudança de status.** A entrega acontece 5–7 dias DEPOIS da compra; uma janela de "criados nos últimos 3 dias" nunca reencontra o pedido que foi entregue hoje mas foi comprado semana passada. A rede de segurança precisa listar os pedidos **em aberto do NOSSO banco** (status não terminal) e reconsultá-los por `order_sn`, sem olhar idade — ver `ShopeeImportOrders::syncOpenOrders()`. Sem isso, um push perdido prende o pedido para sempre.

### Produtos / anúncios
- **Enum de status é `UNLIST`, não `UNLISTED`** (`UNLISTED` → `error_param_item_status`).
- **Estoque do vendedor ≠ disponível.** `seller_stock` é o que se edita; `total_available_stock` é o que o comprador vê (vendedor − reservado). Ler/escrever **sempre `seller_stock`** (foi o bug do "não salvou estoque").
- **`update_price`/`update_stock` devolvem `failure_list`** por variação — 200 HTTP não garante sucesso. `assertNoFailures()`.
- Anúncio **sem variação** → `get_model_list` vazio → preço de `get_item_base_info`, custo casa por `shopee_item_id`.

### Boost / Impulsionar
- **`get_boosted_list`** devolve `item_list` (não `list`) com **`cool_down_second`** (segundos restantes, não epoch). `> 0` = slot ocupado. Adivinhar formato = leitura vazia com 5 slots cheios.
- **Máx. 5 boosts simultâneos**; acima: `product.error_busi — reached shop's bump slot limit`. `boost_item` recebe `item_id_list` (≤5). Boost dura ~4h. Rodízio em `ShopeeBoostRotate` + tabela `shopee_boosts`.

### NF-e (upload)
- **`upload_invoice_doc`**: multipart, campo do arquivo é **`file`**; `file_type` é **INT** — `1=pdf, 2=jpeg, 3=png, 4=XML`. Enum errado → "File error". **XML = 4.** Limite 1MB.

### Logística / etiqueta
- **`create_shipping_document`** só precisa `order_sn` + `tracking_number` — **NÃO** passar `type` (pegar o sugerido por `get_shipping_document_parameter`).
- Download vem em **ZIP com ZPL** (térmica) — extrair. Checar `%PDF` rejeita ZIP válido.
- **`OFG…` é número de pacote, não rastreio.** Rastreio real dos Correios: `AP214204653BR`. Não sobrescrever.
- `labels/` fica 0700 (Laravel private + worker root); o job dá `chmod/chown` para o www-data ler.

### Chat (sellerchat)
- **`from_shop_id` distingue mensagem NOSSA da DO CLIENTE.** Sem checar, a IA responde a si mesma em loop. `isFromShop()`.
- `get_message` devolve a mais recente primeiro; `content['text']` só em `message_type: text`.
- `send_message` usa `to_id` = user_id do cliente (`from_id` da mensagem dele).

### Shopee Ads → detalhe completo em [`ads.md`](ads.md)
- **Janela ≤ 27 dias** (acima: "1 mês"). Datas em **America/Sao_Paulo** (UTC de madrugada vira data futura em SP → recusa).
- **`get_product_campaign_daily_performance`: UMA campanha por chamada.** O lote não devolve `campaign_id` junto das métricas → casar por posição joga gasto no produto errado.
- **Métrica `direct_` vs `broad_`:** use `direct_roas` para a verdade (o próprio item comprado); `broad_` infla (qualquer item em 7 dias). Atribuição inclui **impressão** ("participou", não "causou").
- **ROAS alvo:** `max(breakeven, get_product_recommended_roi_target.lower_bound)`. Alvo alto demais → pouca impressão → poucas reviews.
- **`campaign_surge`/Impulsão Rápida derruba a Proteção ROAS para 70%** do alvo. `auto_top_up` = recarga automática (lojista desligou de propósito).
- **Gasto de Ads sai da carteira de Ads (TOPUP), NÃO do payout de vendas** — não misturar na conciliação.
- `create_auto_product_ads` está **deprecado** ("coming offline soon") — usar `create_manual_product_ads`.

### Conciliação financeira → detalhe completo em [`financeiro.md`](financeiro.md)
- **A verdade é o escrow no momento do payout, não o do dia da venda:** devolução parcial, disputa (DRC) e compensação de extravio mudam o `escrow_amount` depois. Sempre reconsultar.
- **`get_payout_detail` fecha a conta:** `payout_amount == Σ escrow_list.escrow_amount + Σ offline_adjustment_list.adjustment_amount`. Diferença sem ajuste = alerta.
- **Janela de payout ≤ 15 dias** (paginar acima disso).

---

## 6. Webhooks (Live Push) — códigos CONFIRMADOS na doc oficial

O `code` do **payload** (campo `push_code` na doc) ≠ `push_api_id` (id interno do catálogo). O ERP roteia pelo `code` do corpo — **validado contra o `push_content` oficial**:

| `code` (payload) | push oficial | ação no ERP (`IntegrationController::webhookShopee`) |
|---|---|---|
| 0 | verificação de URL do console | responder 200 **sem** validar assinatura |
| 3 | `order_status_push` | `ImportShopeeOrder` (importa/atualiza via fila) |
| 4 | `order_trackingno_push` | grava tracking + `PrepareShopeeShipment` |
| 10 | `webchat_push` | `RespondShopeeChat` (IA responde/rascunha) |
| 15 | `shipping_document_status_push` | `PrepareShopeeShipment` (baixa etiqueta) |
| **30** | **`package_fulfillment_status_push`** | **`ImportShopeeOrder` — é AQUI que a ENTREGA chega** |
| 5 | `shopee_updates` | só ruído de marketing da Shopee (ignorar) |

> ⚠️ **A ENTREGA NÃO VEM NO `code 3`.** Ela chega no **`code 30`** (`package_fulfillment_status_push`), com
> `data.fulfillment_status = LOGISTICS_DELIVERY_DONE` + `data.ordersn` + `data.package_number`. A Shopee **não**
> empurra `order_status_push` nessa transição, mesmo o status do pedido virando `TO_CONFIRM_RECEIVE`.
> Custou um pedido preso em "Enviado" por dias. Outros valores de `fulfillment_status`: `LOGISTICS_REQUEST_CREATED`,
> `LOGISTICS_PICKUP_DONE`, etc. — o job re-consulta o pedido e o `STATUS_MAP` resolve o resto.

- Push é assinado com a **"Live Push Partner Key"** (≠ partner_key da API!). Tenta text E hex2bin dela, depois a partner_key.
- `data.ordersn`/`order_sn` para pedidos; `data.content.conversation_id` para chat.
- Outros codes úteis (na doc, ainda não roteados): `32` return_updates, `12` authorization_expiry, `16` shop_authorization_canceled, `6` item_promotion. Puxe o payload com `push/doc?push_api_id=N`.

---

## 7. Como adicionar um endpoint novo (padrão do repositório)

1. **Confirme a spec oficial primeiro** (§3, `doc/api/?api_name=...`) — não invente param/campo.
2. **Reaproveite o serviço do módulo** (`ShopeeProductService`, `ShopeeAdsService`, ...) — todos têm `get()`/`post()` assinados. Só adicione o método.
3. Módulo novo: copie `ShopeeChatService` (HOST, `call()` que assina com a fórmula de loja, `unwrap()` que joga `RuntimeException` em `error`).
4. **Sempre** cheque `failure_list`/`error` — a Shopee devolve 200 com erro de negócio no corpo.
5. Datas de Ads/relatório em `America/Sao_Paulo`; respeite o teto de janela do endpoint.
6. Cache pesado com **arrays puros** (Collection serializada estoura no unserialize); TTL curto + invalidar na escrita.
7. Antes de ação real (impulsionar/emitir/enviar), rode a **leitura** correspondente e valide o JSON cru — foi assim que se pegou `cool_down_second`/`item_list`.

---

## 8. Postura ao usar esta skill

- A doc oficial É acessível (§3) — **confirme lá em vez de adivinhar**. Se um endpoint não estiver no código nem retornar na API de doc, diga que precisa confirmar e proponha um probe de leitura.
- Ações que atingem clientes reais (chat, NF-e, envio) exigem aprovação do lojista sobre conteúdo/gatilho.
- Ao descobrir pegadinha nova, **adicione ao Ledger (§5)** — é a memória que evita repetir o erro.
