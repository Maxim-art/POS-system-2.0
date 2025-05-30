import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreditCard, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Debt, Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { debtApi } from '@/api/debtApi';

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

interface ApiDebt {
  customer_id: number;
  customer_name: string;
  debt_amount: string;
  last_debt_time: string;
  isPaid?: boolean; // Добавлено для совместимости
  paymentDate?: string; // Добавлено для совместимости
}

interface ApiResponse<T> {
  data: T[];
  pagination: {
    total_records: number;
    current_page: number;
    total_pages: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);

  // Статистика для карточек
  const [stats, setStats] = useState({
    totalPending: 0,
    pendingCount: 0,
    totalPaid: 0,
    paidCount: 0,
    oldestDebt: null as Debt | null,
  });

  // Загрузка статистики
  const fetchStats = async () => {
    try {
      const [pendingResponse, recentResponse] = await Promise.all([
        debtApi.getPending(),
        debtApi.getRecent(),
      ]);

      const pendingDebts = pendingResponse.data?.data || [];
      const paidDebts = recentResponse.data?.data || [];

      const totalPending = pendingDebts.reduce((sum: number, debt: ApiDebt) => sum + parseFloat(debt.debt_amount || '0'), 0);
      const totalPaid = paidDebts.reduce((sum: number, debt: ApiDebt) => sum + parseFloat(debt.debt_amount || '0'), 0);

      // Найти самый старый долг
      const oldestDebt = pendingDebts.length > 0
        ? pendingDebts.reduce((oldest: ApiDebt, debt: ApiDebt) =>
            new Date(debt.last_debt_time) < new Date(oldest.last_debt_time) ? debt : oldest
          )
        : null;

      // Преобразование в формат Debt для совместимости
      const convertToDebt = (apiDebt: ApiDebt): Debt => ({
        id: apiDebt.customer_id.toString(), // Предполагаем, что customer_id можно использовать как id
        amount: parseFloat(apiDebt.debt_amount || '0'),
        date: apiDebt.last_debt_time,
        isPaid: apiDebt.isPaid || false,
        paymentDate: apiDebt.paymentDate,
        customer: {
          id: apiDebt.customer_id,
          name: apiDebt.customer_name,
          phone: '', // Добавить, если API вернет телефон
          comment: '', // Добавить, если API вернет комментарий
        },
      });

      setStats({
        totalPending,
        pendingCount: pendingDebts.length,
        totalPaid,
        paidCount: paidDebts.length,
        oldestDebt: oldestDebt ? convertToDebt(oldestDebt) : null,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Загрузка данных о долгах с пагинацией и поиском
  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true);

      let response: AxiosResponse<ApiResponse<ApiDebt>>;
      if (searchQuery.trim()) {
        // Если есть поисковый запрос, используем поиск
        response = await debtApi.search({
          customerName: searchQuery,
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
        });
      } else {
        // Обычная загрузка с пагинацией
        response = await debtApi.getAll(pagination.pageIndex + 1, pagination.pageSize);
      }

      const apiDebts = response.data.data || [];
      // Преобразование данных API в формат Debt
      const convertedDebts = apiDebts.map((debt: ApiDebt) => ({
        id: debt.customer_id.toString(),
        amount: parseFloat(debt.debt_amount || '0'),
        date: debt.last_debt_time,
        isPaid: debt.isPaid || false,
        paymentDate: debt.paymentDate,
        customer: {
          id: debt.customer_id,
          name: debt.customer_name,
          phone: '', // Добавить, если API вернет телефон
          comment: '', // Добавить, если API вернет комментарий
        },
      }));

      setDebts(convertedDebts);
      setTotalCount(response.data.pagination.total_records || 0);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить долги",
        variant: "destructive",
      });
      setDebts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

  // Отметить долг как оплаченный
  const handleMarkAsPaid = async (id: string) => {
    try {
      setMarkingPaid(id);
      await debtApi.markAsPaid(id);

      // Обновляем локальное состояние
      setDebts(
        debts.map((debt) =>
          debt.id === id
            ? {
                ...debt,
                isPaid: true,
                paymentDate: new Date().toISOString(),
              }
            : debt
        )
      );

      // Обновляем статистику
      await fetchStats();

      toast({
        title: "Успешно",
        description: "Долг отмечен как оплаченный",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить долг как оплаченный",
        variant: "destructive",
      });
    } finally {
      setMarkingPaid(null);
    }
  };

  // Обработчик изменения пагинации
  const handleChangePagination = (newPagination: PaginationState) => {
    setPagination(newPagination);
  };

  // Обработчик изменения поиска
  const handleChangeSearch = (query: string) => {
    setSearchQuery(query);
    // Сбрасываем на первую страницу при поиске
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  // Обновить все данные
  const handleRefresh = () => {
    fetchDebts();
    fetchStats();
  };

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  useEffect(() => {
    fetchStats();
  }, []);

  const columns: ColumnDef<Debt>[] = [
    {
      accessorKey: 'customer.name',
      header: 'Клиент',
      cell: ({ row }) => {
        const customer: Customer = row.original.customer || { name: 'Неизвестно', phone: '', comment: '' };
        return (
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-muted-foreground">{customer.phone || '-'}</div>
            {customer.comment && (
              <div className="text-xs text-muted-foreground italic">
                {customer.comment}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Сумма',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Дата создания',
      cell: ({ row }) => {
        const date = row.original.date ? new Date(row.original.date) : null;
        return date && !isNaN(date.getTime()) ? formatDate(date) : '-';
      },
    },
    {
      accessorKey: 'isPaid',
      header: 'Статус',
      cell: ({ row }) => (
        <Badge variant={row.original.isPaid ? 'outline' : 'default'}>
          {row.original.isPaid ? 'Оплачено' : 'Ожидает'}
        </Badge>
      ),
    },
    {
      accessorKey: 'paymentDate',
      header: 'Дата оплаты',
      cell: ({ row }) => {
        const date = row.original.paymentDate ? new Date(row.original.paymentDate) : null;
        return date && !isNaN(date.getTime()) ? formatDate(date) : '-';
      },
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => {
        const debt = row.original;
        const isMarking = markingPaid === debt.id;

        return (
          <div className="flex justify-end">
            {!debt.isPaid && (
              <Button
                size="sm"
                onClick={() => handleMarkAsPaid(debt.id)}
                disabled={isMarking}
                className="h-8 bg-green-600 hover:bg-green-700"
              >
                {isMarking ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {isMarking ? 'Обработка...' : 'Отметить оплату'}
              </Button>
            )}
            {debt.isPaid && (
              <Button size="sm" variant="outline" disabled className="h-8">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Оплачено
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Долги</h2>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего к оплате
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              От {stats.pendingCount} клиент{stats.pendingCount !== 1 ? 'ов' : 'а'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Самый старый долг
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.oldestDebt
                ? formatDate(new Date(stats.oldestDebt.date))
                : 'Нет данных'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.oldestDebt
                ? `${stats.oldestDebt.customer.name} - ${formatCurrency(stats.oldestDebt.amount)}`
                : 'Нет неоплаченных долгов'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего оплачено
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paidCount} платеж{stats.paidCount !== 1 ? 'ей' : ''} получено
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={debts}
        searchPlaceholder="Поиск по имени клиента..."
        searchKey="customer.name"
        isLoading={loading}
        handleChangeSearch={handleChangeSearch}
        rowCount={totalCount}
        pageSize={pagination.pageSize}
        handleChangePagination={handleChangePagination}
      />
    </div>
  );
}