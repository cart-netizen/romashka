// Модель навигации, передаваемая из серверного Header в клиентские компоненты.
// Все URL ассетов уже разрешены на сервере (строки), чтобы не тянуть server-only код на клиент.

export interface NavPromo {
  id: number;
  title: string;
  link: string;
  image: string | null;
}

export interface NavSubcategory {
  id: number;
  name: string;
  slug: string;
}

export interface NavCategory {
  id: number;
  name: string;
  slug: string;
  subcategories: NavSubcategory[];
  promos: NavPromo[];
}
