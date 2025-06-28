// Reusable pagination slice for stores

import { StateCreator } from "zustand";

export interface PaginationSlice {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setPagination: (pagination: Partial<PaginationSlice["pagination"]>) => void;
  resetPagination: () => void;
}

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export const createPaginationSlice: StateCreator<
  PaginationSlice,
  [],
  [],
  PaginationSlice
> = (set) => ({
  pagination: defaultPagination,

  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, page },
    })),

  setLimit: (limit) =>
    set((state) => ({
      pagination: {
        ...state.pagination,
        limit,
        totalPages: Math.ceil(state.pagination.total / limit),
      },
    })),

  setPagination: (pagination) =>
    set((state) => ({
      pagination: {
        ...state.pagination,
        ...pagination,
        totalPages:
          pagination.total !== undefined &&
          (pagination.limit || state.pagination.limit)
            ? Math.ceil(
                pagination.total / (pagination.limit || state.pagination.limit),
              )
            : state.pagination.totalPages,
      },
    })),

  resetPagination: () => set({ pagination: defaultPagination }),
});
