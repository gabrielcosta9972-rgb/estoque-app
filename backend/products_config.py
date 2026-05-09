"""
========================================================================
   EDITE ESTE ARQUIVO PARA ADICIONAR / REMOVER / RENOMEAR PRODUTOS
========================================================================

FORMATO BÁSICO:
  - "Nome do produto"               -> conta por UNIDADE (un)
  - "Nome do produto | kg"          -> conta por QUILO (kg)
  - "Nome do produto | L"           -> conta por LITRO (L)
  - "Nome do produto | g"           -> conta por GRAMA (g)

Você pode usar QUALQUER unidade depois do '|'. Exemplos:
    "Tomate | kg"          -> 5 kg
    "Leite | L"            -> 2 L
    "Sabão em Pó | un"     -> 3 un (mesmo que sem '|')
    "Refrigerante | 2L"    -> 4 garrafas de 2L

COMO FUNCIONA:
  - Toda vez que o servidor reinicia, o banco é sincronizado:
      * Produto novo na lista  -> CRIADO
      * Produto removido       -> APAGADO
      * Mudou unidade ou nome  -> Apaga o antigo e cria o novo
  - Pedidos antigos NÃO mudam (a unidade fica congelada no pedido).

CUIDADO:
  - Cada nome entre aspas "..." e separado por vírgula.
  - Sem vírgula sozinha depois do colchete final ].
========================================================================
"""

PRODUCTS = {
    "Secos": [
        "Arroz | kg",
        "Feijão | kg",
        "Açúcar | kg",
        "Sal | kg",
        "Macarrão 500g",
        "Farinha | kg",
        "Óleo 900ml",
    ],
    "Geladeira": [
        "Leite | L",
        "Manteiga 200g",
        "Queijo Mussarela | kg",
        "Presunto | kg",
        "Iogurte",
        "Margarina",
    ],
    "Limpeza": [
        "Detergente",
        "Sabão em Pó",
        "Desinfetante | L",
        "Água Sanitária | L",
        "Esponja",
        "Álcool 70% | L",
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
        "Tomate | kg",
        "Cebola | kg",
        "Alho | kg",
    ],
    "Outros": [
        # Adicione aqui produtos avulsos
    ],
}
