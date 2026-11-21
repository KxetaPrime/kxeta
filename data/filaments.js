// Marcas e linhas de filamento exibidas no site.
// price: preço por kg (null = "preço sob consulta", o botão vira pedido pelo WhatsApp).
// cartId: só para as linhas que vão direto ao carrinho (usa a regra de atacado do app.js).
// colors: nome em português, hex da amostra, translucent opcional. Flashforge usa as cores de app.js (ffVariants).
// Bambu Lab e Masterprint: cores de referência das linhas; confirmar o que há em estoque e os preços.
window.NP_FIL = [
  { id:'flashforge', name:'Flashforge', logo:'assets/brands/flashforge.svg', accent:'#E9ECEA',
    about:'Filamentos originais com cores firmes e bom acabamento para o dia a dia.',
    lines:[
      { id:'ff-pla', name:'PLA Basic', cartId:'fil_pla', price:85, wholesale:80, fromApp:'PLA' },
      { id:'ff-petg', name:'PETG Basic', cartId:'fil_petg', price:85, wholesale:80, fromApp:'PETG' }
    ]},
  { id:'bambulab', name:'Bambu Lab', logo:'assets/brands/bambulab.svg', accent:'#00AE42',
    about:'A linha mais usada nas impressoras Bambu Lab, com dezenas de cores.',
    lines:[
      { id:'bl-pla-basic', name:'PLA Basic', price:null, colors:[
        ['Branco Jade','#FFFFFF'],['Bege','#F7E6DE'],['Cinza Claro','#D1D3D5'],['Cinza','#8E9089'],['Cinza Escuro','#545454'],['Preto','#000000'],
        ['Prata','#A6A9AA'],['Dourado','#E4BD68'],['Bronze','#847D48'],['Marrom','#9D432C'],['Marrom Cacau','#6F5034'],['Vermelho','#C12E1F'],
        ['Vinho','#9D2235'],['Magenta','#EC008C'],['Rosa','#F55A74'],['Rosa Choque','#F5547C'],['Laranja','#FF6A13'],['Abóbora','#FF9016'],
        ['Amarelo','#F4EE2A'],['Girassol','#FEC600'],['Verde Bambu','#00AE42'],['Verde Musgo','#3F8E43'],['Turquesa','#00B1B7'],['Ciano','#0086D6'],
        ['Azul Cobalto','#0056B8'],['Azul','#0A2989'],['Azul Acinzentado','#5B6579'],['Roxo','#5E43B7'],['Roxo Índigo','#482960']]}
    ]},
  { id:'masterprint', name:'Masterprint', mono:'MP', logo:null, accent:'#F07A1A',
    about:'Marca nacional com PLA e PETG em carretel de 1 kg, ótima para produção.',
    lines:[
      { id:'mp-pla', name:'PLA', price:null, colors:[['Branco Fosco','#F1F1EE'],['Preto','#1E1E20'],['Amarelo','#F5C518'],['Roxo','#6B3FA0'],['Dourado','#C9A23F']]},
      { id:'mp-petg', name:'PETG', price:null, colors:[['Branco','#F4F4F2'],['Preto','#1E1E20'],['Cinza','#8A8F96'],['Amarelo','#F5C518'],['Laranja','#F07A1A'],['Bronze','#9C6B3C'],['Lavanda','#B69CD9'],
        ['Azul Translúcido','#3E7BD6',true],['Verde Translúcido','#2FB35A',true],['Transparente','#DCE6EA',true]]}
    ]}
];
