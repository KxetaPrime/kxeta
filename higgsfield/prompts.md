# Prompts do Higgsfield — Hero "Impressão pelo scroll"

O hero do site mostra uma peça sendo **impressa camada por camada enquanto a pessoa rola a página**.
Para isso precisamos de **um único vídeo curto** (6 a 8 s), que eu fatio em quadros e desenho num canvas.
A cor do filamento é aplicada por código sobre o vídeo, então **o vaso precisa ser branco/cinza-claro**, sobre fundo preto.
Assim um só vídeo serve para as 13 cores do PLA e as 3 do PETG.

## Regras que valem para todos os prompts
- Objeto **branco ou cinza muito claro**, fundo **preto fosco**. Nada de luz colorida (a luz de contorno tem que ser branca/neutra, senão a cor sai errada).
- Sem pessoas, sem texto, sem logotipos, sem marcas de impressora.
- Câmera **fixa** (no máximo uma órbita lenta de uns 10 graus), sem cortes.
- **Sem áudio.**
- A peça fica centralizada, ocupando cerca de 60% da altura do quadro, com espaço livre dos dois lados (o texto do site entra ali).

## Passo 1 · Quadro inicial (imagem)
**Modelo:** Nano Banana 2 (rápido e barato) · **Proporção:** 16:9 · **Resolução:** 1k

```
Cinematic macro photograph of a desktop FDM 3D printer in a dark studio. Matte black background and
matte black build plate. A chrome extruder nozzle sits centered just above the plate, touching it,
depositing the very first thin line of pure white filament. Soft neutral white rim light from the
upper left, subtle reflections on the nozzle, shallow depth of field, ultra sharp, high contrast,
no people, no text, no logo, nothing else in frame. Centered composition with empty space on both sides.
```

## Passo 2 · Quadro final (imagem)
**Modelo:** Nano Banana 2 · **Proporção:** 16:9 · **Referência:** use a imagem do Passo 1 como `image_references`
(para manter exatamente a mesma cena e câmera).

```
Same scene, same camera, same lighting and same matte black background as the reference image.
The 3D print is now finished: an elegant tall white vase with a wide belly, a narrow neck and a flared
rim, with clearly visible fine horizontal layer lines all the way up. The chrome nozzle hovers just
above the rim. Pure white and light grey material only, neutral white rim light, high contrast,
no people, no text, no logo. Vase centered, about 60% of the frame height.
```

## Passo 3 · O vídeo
**Modelo recomendado:** Seedance 2.0 Mini (`seedance_2_0_mini`), a opção rápida e econômica.
Se o saldo permitir, `cinematic_studio_3_0` dá o melhor acabamento.

| Campo | Valor |
|---|---|
| Quadro inicial (`start_image`) | imagem do Passo 1 |
| Quadro final (`end_image`) | imagem do Passo 2 |
| Proporção | 16:9 |
| Duração | 6 a 8 s |
| Resolução | 720p (suficiente, eu otimizo depois) |
| Áudio | desligado (`generate_audio: false`) |

```
Time-lapse of a 3D print in progress. Starting from the first thin line on the empty black build plate,
the printer builds a tall elegant white vase layer by layer from the bottom to the top. The chrome nozzle
moves steadily along each layer while the vase grows smoothly and continuously, with crisp horizontal
layer lines. The camera is locked off with at most a very slow, subtle orbit of about 10 degrees. Matte black
background, neutral white rim light, high contrast, no cuts, no people, no text, no logo, no sound.
The vase is complete at the final frame.
```

> Conferir no app o custo em créditos antes de gerar. O saldo atual é de 10 créditos (plano gratuito).
> Ordem sugerida: imagens primeiro (baratas), vídeo por último.

## O que me mandar
1. O **MP4** do Passo 3 (baixar do Higgsfield e anexar aqui no chat).
2. O **PNG do Passo 1** (vira o pôster, a imagem que aparece na hora, antes do vídeo carregar).

Eu converto em sequência de quadros WebP (versão desktop e versão leve para celular), faço o pôster e ligo ao scroll.

## Opcional (só se sobrar crédito)
- **Loop de ambiente para a primeira dobra**, 5 s, 16:9, sem áudio:
  ```
  Extreme macro of a chrome 3D printer nozzle slowly extruding a thin glowing line of pure white
  filament onto matte black plate, shallow depth of field, soft neutral rim light, very slow
  push-in, seamless calm motion, no people, no text, no logo.
  ```
