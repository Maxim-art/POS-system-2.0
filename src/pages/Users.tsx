import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { LoaderPinwheel, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { cashierApi, CashierSearchParams } from '@/api/cashierApi'
import { getUserColumns } from '@/components/cashiers/Columns'
import { CashierForm } from '@/components/cashiers/CashierForm'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import type { AxiosError } from 'axios'
import type { Cashier, Pagination } from '@/types/api'

// Функция для получения списка пользователей с пагинацией
const fetchCashiers = async (
    page: number = 1,
    pageSize: number = 10
): Promise<{ data: Cashier[]; pagination: Pagination }> => {
    try {
        const response = await cashierApi.getAll(page, pageSize)
        return response.data
    } catch (error) {
        throw new Error('Не удалось загрузить пользователей: ' + (error as Error).message)
    }
}

// Функция для поиска пользователей
const searchCashiers = async (searchValue: string): Promise<Cashier[]> => {
    try {
        const params: CashierSearchParams = { q: searchValue }
        const response = await cashierApi.search(params)
        return response.data.data
    } catch (error) {
        throw new Error('Не удалось выполнить поиск пользователей: ' + (error as Error).message)
    }
}

export function UsersPage() {
    const { toast } = useToast()
    const { user } = useAuth()
    const queryClient = useQueryClient()

    // Состояния для управления формой, редактированием и поиском
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<Cashier | undefined>()
    const [searchValue, setSearchValue] = useState('')
    const [pagePagination, setPagePagination] = useState({
        pageIndex: 0,
        pageSize: 10
    })

    const isAdmin = user?.role === 'admin'

    // Запрос для получения пользователей
    const {
        data: cashiersResponse,
        isLoading,
        error
    } = useQuery({
        queryKey: ['cashiers', pagePagination.pageIndex + 1, pagePagination.pageSize],
        queryFn: () => fetchCashiers(pagePagination.pageIndex + 1, pagePagination.pageSize),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000 // Данные свежи 5 минут
    })

    // Запрос для поиска пользователей
    const { data: searchResults } = useQuery({
        queryKey: ['cashiers', 'search', searchValue],
        queryFn: () => searchCashiers(searchValue),
        enabled: Boolean(searchValue.trim()),
        staleTime: 2 * 60 * 1000 // Данные поиска свежи 2 минуты
    })

    // Мутация для удаления пользователя
    const deleteMutation = useMutation({
        mutationFn: (id: number) => cashierApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashiers'] })
            toast({
                title: 'Пользователь удалён',
                description: 'Пользователь успешно удалён.'
            })
        },
        onError: (err: AxiosError) => {
            console.error('Удаление не удалось:', err.response?.status, err.response?.data)
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: `Не удалось удалить пользователя: ${err.message}`
            })
        }
    })

    // Мемоизация функции удаления
    const handleDelete = useMemo(() => {
        return (cashier: Cashier) => {
            console.log('handleDelete вызвана для:', cashier)
            deleteMutation.mutate(cashier.id)
        }
    }, [deleteMutation])

    // Мемоизация функции редактирования
    const handleEdit = useMemo(() => {
        return (cashier: Cashier) => {
            console.log('handleEdit вызвана для:', cashier)
            setEditingUser(cashier)
            setIsFormOpen(true)
        }
    }, [])

    // Мемоизация колонок таблицы
    const columns = useMemo(() => getUserColumns(handleEdit, handleDelete), [handleEdit, handleDelete])

    // Данные для отображения
    const displayData = searchValue.trim() && searchResults ? searchResults : cashiersResponse?.data || []

    // Варианты анимации для контейнера с дочерними элементами
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1 // Задержка между анимациями дочерних элементов
            }
        }
    }

    // Варианты анимации для отдельных элементов
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
    }

    // Анимация загрузчика
    const loaderVariants = {
        animate: {
            rotate: 360,
            scale: [1, 1.2, 1],
            transition: {
                rotate: { repeat: Infinity, duration: 1, ease: 'linear' },
                scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
            }
        }
    }

    // Анимация фона диалога
    const dialogBackdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 0.5, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    }

    // Анимация содержимого диалога
    const dialogContentVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }
    }

    // Состояние загрузки
    if (isLoading && !cashiersResponse?.data.length) {
        return (
            <motion.div
                className='flex justify-center items-center min-h-[400px]'
                variants={loaderVariants}
                animate='animate'
            >
                <LoaderPinwheel className='h-8 w-8 text-primary' />
            </motion.div>
        )
    }

    // Состояние ошибки
    if (error) {
        return (
            <motion.div
                className='text-center text-destructive p-8'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <p>Ошибка загрузки пользователей: {error.message}</p>
            </motion.div>
        )
    }

    // Скрытие колонки действий для не-админов
    const filteredColumns = isAdmin ? columns : columns.filter((col: ColumnDef<Cashier>) => col.id !== 'actions')

    return (
        <div className='space-y-8'>
            {/* Заголовок и кнопка добавления пользователя */}
            <motion.div
                className='flex items-center justify-between'
                variants={containerVariants}
                initial='hidden'
                animate='visible'
            >
                <motion.h2 variants={itemVariants} className='text-3xl font-bold tracking-tight'>
                    Пользователи
                </motion.h2>
                {isAdmin && (
                    <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={() => {
                                setEditingUser(undefined)
                                setIsFormOpen(true)
                            }}
                        >
                            <Plus className='mr-2 h-4 w-4' />
                            Добавить пользователя
                        </Button>
                    </motion.div>
                )}
            </motion.div>

            {/* Таблица с данными */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <DataTable
                    columns={filteredColumns}
                    data={displayData}
                    rowCount={!searchValue.trim() ? cashiersResponse?.pagination?.total_records : undefined}
                    searchPlaceholder='Поиск по имени...'
                    searchKey='name'
                    isLoading={isLoading}
                    handleChangeSearch={setSearchValue}
                    pageSize={pagePagination.pageSize}
                    handleChangePagination={setPagePagination}
                    onRowClick={isAdmin ? handleEdit : undefined}
                    rowAnimation={{
                        variants: {
                            hidden: { opacity: 0, x: -20 },
                            visible: (i: number) => ({
                                opacity: 1,
                                x: 0,
                                transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' }
                            })
                        }
                    }}
                />
            </motion.div>

            {/* Диалог для добавления/редактирования пользователя */}
            <AnimatePresence>
                {isFormOpen && (
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <motion.div
                            className='fixed inset-0 bg-black'
                            variants={dialogBackdropVariants}
                            initial='hidden'
                            animate='visible'
                            exit='exit'
                        />
                        <DialogContent className='sm:max-w-lg z-50'>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
                                </DialogTitle>
                            </DialogHeader>
                            <motion.div variants={dialogContentVariants} initial='hidden' animate='visible' exit='exit'>
                                <CashierForm
                                    cashier={editingUser}
                                    onSuccess={() => {
                                        setIsFormOpen(false)
                                        setEditingUser(undefined)
                                        queryClient.invalidateQueries({ queryKey: ['cashiers'] })
                                        toast({
                                            title: 'Пользователь сохранён',
                                            description: 'Пользователь успешно сохранён.'
                                        })
                                    }}
                                    onCancel={() => {
                                        setIsFormOpen(false)
                                        setEditingUser(undefined)
                                    }}
                                />
                            </motion.div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>
        </div>
    )
}
