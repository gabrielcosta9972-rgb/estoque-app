"""
========================================================================
   EDITE ESTE ARQUIVO PARA ADICIONAR / REMOVER / RENOMEAR PRODUTOS
========================================================================

Como funciona:
  - Cada chave abaixo é uma CATEGORIA (deve existir em CATEGORIES no server.py).
  - Cada item da lista é o NOME do produto que aparecerá no app.
  - Toda vez que o servidor reinicia, o banco é sincronizado automaticamente:
      * Produto novo na lista  -> CRIADO no banco
      * Produto removido       -> APAGADO do banco
      * Produto renomeado      -> APAGA o antigo e CRIA o novo
  - Pedidos antigos NÃO são afetados (os nomes ficam guardados no pedido).

CUIDADO:
  - Cada nome entre aspas "..." e separado por vírgula.
  - Sem vírgula sozinha depois do colchete final ].
========================================================================
"""

PRODUCTS = {
    "Secos": [
        "Arroz 5kg",
        "Feijão 1kg",
        "Açúcar 1kg",
        "Sal 1kg",
        "Macarrão 500g",
        "Farinha 1kg",
        "Óleo 900ml",
    ],
    "Geladeira": [
        "Leite 1L",
        "Manteiga 200g",
        "Queijo Mussarela",
        "Presunto 200g",
        "Iogurte",
        "Margarina",
    ],
    "Limpeza": [
        "Detergente",
        "Sabão em Pó",
        "Desinfetante",
        "Água Sanitária",
        "Esponja",
        "Álcool 70%",
    ],
    "Embalagens": [
        "Saco 5kg",
        "Saco 10kg",
        "Marmita P",
        "Marmita G",
        "Copo 200ml",
        "Sacola Plástica",
    ],
    "Hortfrut": [
        "Manjericão",
        "Tomate",
        "Cebola",
        "Alho",
    ],
    "Outros": [
        # Adicione aqui produtos avulsos
    ],
}
