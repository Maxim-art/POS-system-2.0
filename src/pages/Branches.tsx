import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { LoaderPinwheel, Plus } from 'lucide-react';

import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BranchForm } from '@/components/branches/BranchForm.tsx';
import { getBranchColumns } from '@/components/branches/Columns';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { branchApi } from '@/api/branchApi.ts';

import { Branch, Pagination } from '@/types';
import { AxiosError } from 'axios';
import { useToast } from '@/hooks/use-toast.ts';

export function BranchesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | undefined>(undefined);

    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [searchValue, setSearchValue] = useState('');

    const queryClient = useQueryClient();

    const {
        data: branchesResponse = { data: [], pagination: { total_records: 0, current_page: 1, total_pages: 0, next_page: null, prev_page: null } },
        isLoading: isBranchesLoading,
        isError: isBranchesError,
        error: branchesError,
        refetch
    }: UseQueryResult<{ data: Branch[]; pagination: Pagination }, AxiosError> = useQuery({
        queryKey: ['branches', 'list', pagination.pageIndex + 1, pagination.pageSize],
        queryFn: async () => {
            const res = await branchApi.getAll(pagination.pageIndex + 1, pagination.pageSize);
            console.log('API Response:', res.data); // Отладка
            return res.data; // Ожидаем { data: Branch[], pagination: Pagination }
        },
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
    });

    const {
        mutate: deleteBranch,
        isLoading: isDeleting,
        isError: isDeleteError,
        error: deleteError
    } = useMutation({
        mutationFn: (id: number) => branchApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            toast({ title: 'Филиал удалён' });
        },
        onError: (err: AxiosError) => {
            console.error('Удаление не удалось:', err.response?.status, err.response?.data);
            toast({
                variant: 'destructive',
                title: 'Ошибка удаления',
                description: `Не удалось удалить филиал: ${err.message}`,
            });
        },
    });

    // useEffect(() => {
    //     // Принудительное обновление данных после изменения пагинации
    //     refetch();
    // }, [pagination.pageIndex, pagination.pageSize, refetch]);

    const columns: ColumnDef<Branch>[] = useMemo(
        () =>
            getBranchColumns(
                branch => {
                    setEditingBranch(branch);
                    setIsFormOpen(true);
                },
                id => deleteBranch(id)
            ),
        [deleteBranch]
    );

    if (isBranchesLoading && !branchesResponse.data.length) {
        return (
            <div className='centered-spin-icon'>
                <LoaderPinwheel className='spin-icon' />
            </div>
        );
    }

    if (isBranchesError) {
        return <p>Ошибка загрузки филиалов: {branchesError?.message}</p>;
    }

    return (
        <div className='space-y-8'>
            <div className='flex items-center justify-between'>
                <h2 className='text-3xl font-bold tracking-tight'>Филиалы</h2>
                {isAdmin && (
                    <Button
                        onClick={() => {
                            setEditingBranch(undefined);
                            setIsFormOpen(true);
                        }}
                    >
                        <Plus className='mr-2 h-4 w-4' />
                        Добавить филиал
                    </Button>
                )}
            </div>

            <DataTable<Branch>
                columns={columns}
                data={branchesResponse.data ?? []}
                rowCount={branchesResponse.pagination.total_records}
                pageSize={pagination.pageSize}
                handleChangePagination={setPagination}
                searchPlaceholder='Поиск филиалов...'
                searchKey='name'
                onRowClick={branch => {
                    setEditingBranch(branch);
                    setIsFormOpen(true);
                }}
                handleChangeSearch={setSearchValue}
                isLoading={isBranchesLoading}
            />

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>{editingBranch ? 'Редактировать филиал' : 'Добавить филиал'}</DialogTitle>
                    </DialogHeader>
                    <BranchForm
                        branch={editingBranch}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['branches'] });
                            setIsFormOpen(false);
                            toast({ title: 'Филиал сохранён' });
                        }}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}