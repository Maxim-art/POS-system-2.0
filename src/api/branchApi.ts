// import apiClient from './api';
// import { Branch, ApiResponse } from '../types/api';
// import { AxiosResponse } from 'axios';

// export const branchApi = {
//     getAll: (page: number = 1, pageSize: number = 10): Promise<AxiosResponse<ApiResponse<{ data: Branch[]; pagination: Pagination }>>> =>
//         apiClient.get('/branch/list', { params: { page, pageSize } }),

//     getById: (id: number): Promise<AxiosResponse<ApiResponse<Branch>>> =>
//         apiClient.get(`/branch/${id}`),

//     create: (data: Omit<Branch, 'id'>): Promise<AxiosResponse<ApiResponse<Branch>>> =>
//         apiClient.post('/branch/create', data),

//     update: (id: number, data: Partial<Branch>): Promise<AxiosResponse<ApiResponse<Branch>>> =>
//         apiClient.put(`/branch/update/${id}`, data),

//     delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
//         apiClient.delete(`/branch/delete/${id}`)
// };

import apiClient from './api';
import { Branch, ApiResponse, Pagination } from '../types/api';
import { AxiosResponse } from 'axios';

export interface BranchSearchParams {
    q?: string;
}

export const branchApi = {
    getAll: (page: number = 1, pageSize: number = 10): Promise<AxiosResponse<ApiResponse<{ data: Branch[]; pagination: Pagination }>>> =>
        apiClient.get('/branch/list', { params: { page, pageSize } }),

    getById: (id: number): Promise<AxiosResponse<ApiResponse<Branch>>> =>
        apiClient.get(`/branch/${id}`),

    create: (data: Omit<Branch, 'id'>): Promise<AxiosResponse<ApiResponse<Branch>>> =>
        apiClient.post('/branch/create', data),

    update: (id: number, data: Partial<Branch>): Promise<AxiosResponse<ApiResponse<Branch>>> =>
        apiClient.put(`/branch/update/${id}`, data),

    delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
        apiClient.delete(`/branch/delete/${id}`),

    search: (params: BranchSearchParams): Promise<AxiosResponse<ApiResponse<{ data: Branch[] }>>> =>
        apiClient.get('/branch/search', { params }),
};