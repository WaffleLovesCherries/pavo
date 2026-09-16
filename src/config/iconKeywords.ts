/**
 * Words that call for an icon. Keys are file names from src/icons (no .svg);
 * values are the words or phrases that pick that icon when they appear in an
 * ingredient name or a method step. Matching is case- and accent-insensitive,
 * whole words only, and accepts a plain "s"/"es" plural. Longer phrases win
 * over shorter ones ("cream cheese" is cheese, not cream), so list a phrase
 * when a word would otherwise be caught by another entry.
 *
 * Icons with no words (box, ingredients, magnifying-glass, recipes-pie) are
 * used by the UI itself and never inferred.
 */
export const ICON_KEYWORDS: Record<string, string[]> = {
    alcohol: ['rum', 'brandy', 'cognac', 'whisky', 'whiskey', 'liqueur', 'kirsch', 'amaretto', 'cointreau', 'grand marnier', 'wine', 'vodka', 'gin', 'licor', 'ron'],
    bake: ['bake', 'baked', 'baking', 'oven', 'horno', 'hornear'],
    blueberry: ['blueberry', 'blueberries', 'arándano'],
    bread: ['bread', 'loaf', 'baguette', 'brioche', 'sourdough', 'crumb', 'crumbs'],
    butter: ['butter', 'mantequilla', 'beurre'],
    cheese: ['cheese', 'cream cheese', 'mascarpone', 'ricotta', 'queso'],
    cherry: ['cherry', 'cherries', 'cereza', 'griotte'],
    chocolate: ['chocolate', 'couverture', 'cocoa', 'cacao', 'ganache'],
    citrus: ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'yuzu', 'bergamot', 'zest', 'limón', 'naranja'],
    cofee: ['coffee', 'espresso', 'café'],
    cookie: ['cookie', 'biscuit', 'shortbread', 'sablé', 'galleta'],
    cool: ['cool', 'cooled', 'cooling', 'room temperature', 'enfriar'],
    cream: ['cream', 'crème', 'crema', 'nata'],
    cut: ['cut', 'chop', 'chopped', 'dice', 'diced', 'slice', 'sliced', 'trim', 'cortar'],
    egg: ['egg', 'yolk', 'egg white', 'huevo', 'yema', 'meringue'],
    flour: ['flour', 'starch', 'cornstarch', 'harina'],
    foil: ['foil', 'cling film', 'plastic wrap', 'film', 'wrap', 'wrapped', 'papel film'],
    fondue: ['fondue', 'melt', 'melted', 'melting', 'fundir'],
    fruit: ['fruit', 'purée', 'puree', 'apple', 'pear', 'peach', 'apricot', 'mango', 'passion fruit', 'banana', 'fig', 'fruta'],
    ginger: ['ginger', 'jengibre'],
    grapes: ['grape', 'raisin', 'uva'],
    grind: ['grind', 'ground', 'blend', 'blended', 'blender', 'food processor', 'mill', 'triturar', 'moler'],
    hazelnut: ['hazelnut', 'praline', 'praliné', 'gianduja', 'avellana'],
    heat: ['heat', 'heated', 'warm', 'warmed', 'boil', 'boiling', 'simmer', '°c', 'degrees', 'calentar', 'hervir'],
    honey: ['honey', 'miel'],
    jam: ['jam', 'marmalade', 'confiture', 'pectin', 'mermelada'],
    knead: ['knead', 'kneaded', 'kneading', 'dough', 'amasar', 'masa'],
    macaron: ['macaron', 'macaroon'],
    milk: ['milk', 'leche'],
    mix: ['mix', 'mixed', 'mixing', 'whisk', 'whisked', 'combine', 'fold', 'emulsify', 'emulsifying', 'beat', 'mezclar', 'batir'],
    nuts: ['nut', 'almond', 'pistachio', 'walnut', 'pecan', 'cashew', 'peanut', 'macadamia', 'almendra', 'nuez', 'pistacho'],
    oil: ['oil', 'aceite'],
    pan: ['pan', 'skillet', 'frying pan', 'fry', 'fried', 'sauté', 'tray', 'baking tray', 'sheet pan', 'sartén'],
    'pastry-bag': ['piping bag', 'pastry bag', 'manga pastelera'],
    pastry: ['pastry', 'puff pastry', 'croissant', 'tart', 'pie', 'choux', 'hojaldre'],
    peel: ['peel', 'peeled', 'pelar'],
    pipe: ['pipe', 'piped', 'piping', 'escudillar'],
    pot: ['pot', 'stockpot', 'stew', 'braise', 'olla'],
    raspberry: ['raspberry', 'raspberries', 'frambuesa', 'framboise'],
    refrigerate: ['refrigerate', 'fridge', 'refrigerator', 'chill', 'chilled', 'freeze', 'frozen', 'freezer', 'nevera', 'congelar'],
    salt: ['salt', 'fleur de sel', 'sel', 'sal'],
    sauce: ['sauce', 'coulis', 'glaze', 'salsa'],
    saucepan: ['saucepan', 'casserole', 'cazo'],
    spices: ['spice', 'cinnamon', 'vanilla', 'cardamom', 'nutmeg', 'clove', 'pepper', 'chili', 'chilli', 'tonka', 'anise', 'star anise', 'canela', 'vainilla', 'especia'],
    squeeze: ['squeeze', 'squeezed', 'juice', 'press', 'exprimir'],
    stir: ['stir', 'stirred', 'stirring', 'remover'],
    strain: ['strain', 'strained', 'sieve', 'sift', 'sifted', 'filter', 'colar', 'tamizar'],
    strawberry: ['strawberry', 'strawberries', 'fresa'],
    sugar: ['sugar', 'glucose', 'dextrose', 'caramel', 'syrup', 'sorbitol', 'trehalose', 'isomalt', 'azúcar'],
    vegetable: ['vegetable', 'carrot', 'pumpkin', 'beetroot', 'beet', 'potato', 'sweet potato', 'onion', 'garlic', 'tomato', 'verdura', 'zanahoria', 'calabaza', 'tomate', 'cebolla', 'ajo'],
    wait: ['wait', 'rest', 'resting', 'let sit', 'set aside', 'overnight', 'reposar'],
};
