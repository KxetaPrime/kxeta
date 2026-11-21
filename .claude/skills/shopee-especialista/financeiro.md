# Conciliação de contas a receber — Shopee → carteira

Objetivo: provar que **o que caiu na carteira é exatamente o que a Shopee prometeu** por cada venda — e, quando não bater, dizer **por quê** (taxa, ajuste, devolução, compensação, conversão).

Tudo aqui é do módulo **Payment** (`/api/v2/payment/`), specs oficiais confirmadas via a receita da SKILL.md §3.

---

## As três camadas (é isto que se concilia)

```
1. PROMESSA por pedido     get_escrow_detail(order_sn)      → escrow_amount = o que a Shopee vai pagar por AQUELE pedido
2. LOTE de pagamento       get_payout_detail(janela)        → payout_amount = o que de fato saiu para a carteira,
                                                              + escrow_list[] (pedidos do lote) + offline_adjustment_list[]
3. EXTRATO da carteira     get_wallet_transaction_list      → cada crédito/débito com saldo corrente (o "extrato bancário")
```

A conciliação forte fecha na **camada 2**, porque `get_payout_detail` já entrega, no mesmo objeto, o que prometeu (soma dos `escrow_amount` dos pedidos do lote) e o que pagou (`payout_amount`), mais os ajustes que explicam a diferença.

---

## 1. `get_payout_detail` — o coração da conciliação

`POST /api/v2/payment/get_payout_detail` — janela **≤ 15 dias** (`payout_time_from/to`, epoch), paginado (`page_no`, `page_size` ≤100).

Cada item de `payout_list`:
- **`payout_info`**: `payout_amount` (o que caiu na carteira), `payout_time`, `from_amount`/`from_currency` (valor de liquidação), `payout_currency`, `exchange_rate`, `pay_service`, `payee_id`.
- **`escrow_list[]`**: os pedidos daquele lote — `order_sn` + `escrow_amount` (o prometido por pedido) + `currency`.
- **`offline_adjustment_list[]`**: `adjustment_amount`, `module` (motivo), `scenario`, `adjustment_level` (shop/order), `order_sn`, `remark` — **é aqui que mora a diferença** (compensação de extravio, multa, reembolso manual, etc.).

**A equação da conciliação (por lote):**
```
payout_amount  ==  Σ escrow_list.escrow_amount  +  Σ offline_adjustment_list.adjustment_amount
                   (± conversão de moeda; no BR não há: BRL→BRL, exchange_rate = 1)
```
Se fechar, está tudo certo. Se sobrar diferença que os ajustes não explicam → **alerta de conciliação** (investigar aquele lote).

> **BR é doméstico:** `payout_currency = from_currency = BRL`, sem forex. Os campos `*_pri`/`exchange_rate` só importam em cross-border.

---

## 2. `get_escrow_detail` — a promessa, item a item

`POST /api/v2/payment/get_escrow_detail` (`order_sn`). O `order_income` traz o cálculo completo do que o vendedor recebe. Campos que importam:

- **`escrow_amount`** — o valor final que a Shopee promete (== o que entra no `escrow_list` do payout).
- **Taxas (o que a Shopee desconta):** `commission_fee` (comissão), `service_fee` (serviço), `seller_transaction_fee` (transação). **A taxa é a SOMA desses componentes** — nunca `buyer_total − escrow` (isso inclui o frete do comprador e infla). ← já é assim no `ShopeeOrderImporter`.
- **Preço/descontos:** `order_selling_price`, `order_discounted_price`, `seller_discount`, `shopee_discount`, `voucher_from_seller/shopee`, `coins`.
- **Frete:** `actual_shipping_fee`, `shopee_shipping_rebate`, `final_shipping_fee`, `seller_shipping_discount` (no programa de frete BR, o vendedor não paga o frete real → não entra no custo).
- **Ajustes que MUDAM o pagamento depois:** `seller_lost_compensation` (compensação por extravio), `drc_adjustable_refund` (disputa), `seller_return_refund` (devolução parcial). Quando aparecem, o `escrow_amount` do pedido difere do "esperado limpo" — e isso reaparece como `offline_adjustment` no payout.

**Lote:** `get_escrow_detail_batch` faz vários `order_sn` de uma vez (mais barato para conciliar em massa). `get_escrow_list` (janela por `release_time`) lista os `order_sn` já liberados com `payout_amount` e `escrow_release_time` — bom para descobrir QUAIS pedidos entram na conciliação de um período.

---

## 3. `get_wallet_transaction_list` — o extrato (auditoria fina)

`POST /api/v2/payment/get_wallet_transaction_list` — todo movimento da carteira, com **saldo corrente**. Campos: `transaction_type`, `amount`, `current_balance`, `create_time`, `order_sn`, `refund_sn`, `withdrawal_id`, `reason`, `money_flow` (MONEY_IN/OUT), `status` (COMPLETED/FAILED).

`transaction_type` inclui (entre outros): `ESCROW_VERIFIED_ADD` (=101, entrada de venda liberada), `ADJUSTMENT_ADD`/`ADJUSTMENT_MINUS` (ajustes), `WITHDRAWAL_*` (saques), `TOPUP_*` (recargas — inclui a recarga de Ads). Use `transaction_type`/`money_flow` para separar **receita de venda** de **saque** e de **gasto de Ads**.

`get_billing_transaction_info` (usa `encrypted_payout_id` de `get_payout_info`) abre cada lote em transações rotuladas `Escrow (Order Income)` vs `Adjustment`, com status `To Release`/`Released` — o detalhamento contábil do lote.

---

## 4. Receita de conciliação (como montar no ERP)

Fluxo sugerido para um comando `shopee:conciliar` (janela de N dias, ≤15 por chamada de payout):

1. **Puxe os lotes:** `get_payout_detail(from, to)` paginando até `more=false`.
2. **Para cada lote**, calcule:
   `esperado = Σ escrow_list.escrow_amount + Σ offline_adjustment_list.adjustment_amount`
   e compare com `payout_amount`. Tolerância de centavo (arredondamento).
3. **Case com os pedidos do ERP:** cada `order_sn` do `escrow_list` deve existir em `orders` com `net_received` == `escrow_amount`. Divergência aqui = o escrow mudou depois (devolução/compensação) → reprocessar aquele pedido (`shopee:refresh-financials` já busca o escrow real).
4. **Relatório de 3 números por período:**
   - **Prometido** = Σ escrow dos pedidos liberados.
   - **Recebido** = Σ payout_amount que caiu na carteira.
   - **Ajustes** = Σ offline_adjustments (com motivo).
   - Verde se `Recebido == Prometido + Ajustes`; vermelho + lista dos lotes que não fecham.
5. **Cruze com o extrato:** `get_wallet_transaction_list` filtrando `ESCROW_VERIFIED_ADD` deve somar o mesmo "Recebido" de venda no período. Saques e recargas de Ads saem à parte (não são receita).

### Pegadinhas da conciliação
- **Janela do payout é ≤15 dias.** Períodos maiores → paginar em blocos de 15 dias.
- **Escrow muda depois da liberação:** devolução parcial, disputa (DRC) e compensação de extravio alteram o `escrow_amount` — por isso o valor "prometido no dia da venda" pode diferir do "liberado". A verdade é o escrow no momento do payout. Reconsultar (nunca confiar em snapshot antigo).
- **Gasto de Ads NÃO sai do payout de vendas** — sai da carteira de Ads (recarga via `TOPUP`). Não misturar: receita de venda ≠ carteira de Ads. Ver `ads.md`.
- **`money_flow`/`transaction_type`** são os filtros que separam venda de saque de ajuste — sem eles, o extrato soma tudo junto e a conta "não fecha".
- Valores em **centavos vs reais:** confira a escala do campo (a API devolve float em reais no BR); somar sem normalizar gera erro de 100×.
