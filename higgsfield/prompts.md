# Prompts do Higgsfield — slide 1 do topo do site

O slide 1 aceita uma **imagem** ou um **vídeo** de fundo. O texto fica à esquerda, então a cena precisa ter
**espaço escuro e vazio do lado esquerdo** e o assunto do lado direito.

## Opção A · Imagem (mais barata, recomendada para começar)
**Modelo:** Nano Banana Pro · **Proporção:** 16:9 · **Resolução:** 2k

```
Cinematic macro photograph of a desktop 3D printer nozzle printing a glowing neon-green layered vase
on a matte black build plate. Dark moody studio, soft green rim light, visible fine layer lines,
shallow depth of field, subject on the right third of the frame, large empty dark space on the left
side, ultra sharp, high contrast. No text, no logos, no people.
```

Versão para celular (opcional) · **Proporção:** 9:16

```
Same scene, vertical composition: the 3D printer nozzle and the glowing neon-green layered vase in the
upper half of the frame, the lower half dark and empty. No text, no logos, no people.
```

## Opção B · Vídeo curto em loop
**Modelo:** Seedance 2.0 Mini · **Proporção:** 16:9 · **Duração:** 5 s · **Resolução:** 720p · **Áudio:** desligado
Use a imagem da Opção A como **start_image**.

```
Slow cinematic push-in on the 3D printer nozzle depositing glowing neon-green filament layer by layer
onto the vase. Smooth, calm motion, locked framing, dark studio, soft green rim light.
No text, no logos, no people, no sound.
```

## Depois de gerar
Avise no chat. A conexão com o Higgsfield consegue **ler o seu histórico de gerações**, então eu puxo o arquivo
direto de lá, otimizo (WebP para imagem, MP4 leve para vídeo, versão menor para celular) e ligo em `data/hero.js`.
