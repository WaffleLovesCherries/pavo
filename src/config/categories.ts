/**
 * Recipe categories. Add a line here to create a new category;
 * the `key` is what you write in a recipe's `category:` frontmatter.
 */
export interface Category {
  key: string;
  label: string;
  color: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { key: 'ganache', label: 'Ganache',         color: '#7A3E22', icon: 'chocolate'  },
  { key: 'jam',     label: 'Mermelada',       color: '#8C2F2F', icon: 'jam'        },
  { key: 'cream',   label: 'Crema',           color: '#9A7420', icon: 'cream'      },
  { key: 'filling', label: 'Relleno',         color: '#A9713F', icon: 'pastry-bag' },
  { key: 'sauce',   label: 'Salsa',           color: '#B0522E', icon: 'sauce'      },
  { key: 'bread',   label: 'Pan',             color: '#8A6647', icon: 'bread'      },
  { key: 'pastry',  label: 'Pastelería',      color: '#6F5B3A', icon: 'pastry'     },
  { key: 'dessert', label: 'Postre',          color: '#7B4E5B', icon: 'dessert'    },
  { key: 'main',    label: 'Plato principal', color: '#5B6A3E', icon: 'pot'        },
];

export const ALL_COLOR = '#6F4428';

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as [string, ...string[]];

export function getCategory(key: string): Category {
  const cat = CATEGORIES.find((c) => c.key === key);
  if (!cat) throw new Error(`Unknown category "${key}"`);
  return cat;
}
