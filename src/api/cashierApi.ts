// import apiClient from './api'
// import { Cashier, ApiResponse } from '../types/api'
// import { AxiosResponse } from 'axios'

// export const cashierApi = {
//     getAll: (page: number = 1, pageSize: number = 10): Promise<AxiosResponse<ApiResponse<{ data: Cashier[]; pagination: Pagination }>>> =>
//         apiClient.get('/cashier/list', { params: { page, pageSize } }),

//     getById: (id: number): Promise<AxiosResponse<ApiResponse<Cashier>>> =>
//         apiClient.get(`/cashier/${id}`),

//     create: (data: Omit<Cashier, 'id'>): Promise<AxiosResponse<ApiResponse<Cashier>>> =>
//         apiClient.post('/cashier/create', data),

//     update: (id: number, data: Partial<Cashier>): Promise<AxiosResponse<ApiResponse<Cashier>>> =>
//         apiClient.put(`/cashier/update/${id}`, data),

//     delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
//         apiClient.delete(`/cashier/delete/${id}`)
// }

// // Определение типа Pagination (если еще не определено в types/api.ts)
// interface Pagination {
//     total_records: number;
//     current_page: number;
//     total_pages: number;
//     next_page: number | null;
//     prev_page: number | null;
// }

import apiClient from './api';
import { Cashier, ApiResponse, Pagination } from '../types/api';
import { AxiosResponse } from 'axios';

export interface CashierSearchParams {
    q?: string;
}

export const cashierApi = {
    getAll: (page: number = 1, pageSize: number = 10): Promise<AxiosResponse<ApiResponse<{ data: Cashier[]; pagination: Pagination }>>> =>
        apiClient.get('/cashier/list', { params: { page, pageSize } }),

    getById: (id: number): Promise<AxiosResponse<ApiResponse<Cashier>>> =>
        apiClient.get(`/cashier/${id}`),

    create: (data: Omit<Cashier, 'id'>): Promise<AxiosResponse<ApiResponse<Cashier>>> =>
        apiClient.post('/cashier/create', data),

    update: (id: number, data: Partial<Cashier>): Promise<AxiosResponse<ApiResponse<Cashier>>> =>
        apiClient.put(`/cashier/update/${id}`, data),

    delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
        apiClient.delete(`/cashier/delete/${id}`),

    search: (params: CashierSearchParams): Promise<AxiosResponse<ApiResponse<{ data: Cashier[] }>>> =>
        apiClient.get('/cashier/search', { params }),
};