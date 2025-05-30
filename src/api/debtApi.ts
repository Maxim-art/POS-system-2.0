import apiClient from './api';
import { Debt, ApiResponse } from '../types/api';
import { AxiosResponse } from 'axios';

export interface DebtSearchParams {
  customerName?: string;
  phone?: string;
  isPaid?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface DebtCreateData {
  customerId: string;
  amount: number;
  comment?: string;
}

export interface DebtUpdateData {
  amount?: number;
  comment?: string;
}

export const debtApi = {
  // Получить все долги с пагинацией
  getAll: (page: number = 1): Promise<AxiosResponse<ApiResponse<Debt[]>>> =>
    apiClient.get('/debt/list', { params: { page } }),

  // Получить только неоплаченные долги
  getPending: (): Promise<AxiosResponse<ApiResponse<Debt[]>>> =>
    apiClient.get('/debt/pending'),

  // Получить самый старый долг
  getOldest: (): Promise<AxiosResponse<ApiResponse<Debt>>> =>
    apiClient.get('/debt/oldest'),

  // Получить недавние платежи
  getRecent: (): Promise<AxiosResponse<ApiResponse<Debt[]>>> =>
    apiClient.get('/debt/recent'),

  // Поиск долгов по параметрам
  search: (params: DebtSearchParams): Promise<AxiosResponse<ApiResponse<Debt[]>>> =>
    apiClient.get('/debt/search', { params }),

  // Получить историю долгов конкретного клиента
  getCustomerHistory: (customerId: string): Promise<AxiosResponse<ApiResponse<Debt[]>>> =>
    apiClient.get(`/debt/debt-history/${customerId}`),

  // Создать новый долг
  create: (data: DebtCreateData): Promise<AxiosResponse<ApiResponse<Debt>>> =>
    apiClient.post('/debt/create', data),

  // Обновить сумму долга для конкретного клиента (массовое обновление)
  updateAllAmount: (customerId: string, amount: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.put(`/debt/update-all-amount/${customerId}`, { amount }),

  // Обновить конкретный долг
  update: (id: string, data: DebtUpdateData): Promise<AxiosResponse<ApiResponse<Debt>>> =>
    apiClient.put(`/debt/update-amount/${id}`, data),

  // Отметить долг как оплаченный
  markAsPaid: (id: string): Promise<AxiosResponse<ApiResponse<Debt>>> =>
    apiClient.put(`/debt/update-amount/${id}`, { isPaid: true, paymentDate: new Date().toISOString() }),

  // Удалить долг
  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/debt/delete/${id}`),
};