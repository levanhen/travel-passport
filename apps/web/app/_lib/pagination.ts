export type PageMeta = {
  page: number;
  limit: number;
  total: number;
};

export type PagedResult<T> = {
  data: T[];
  meta: PageMeta;
};

export function hasMorePages(meta: PageMeta): boolean {
  return meta.page * meta.limit < meta.total;
}

export const DEFAULT_PAGE_SIZE = 20;
