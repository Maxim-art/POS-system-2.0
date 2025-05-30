import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { LoaderPinwheel, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BranchForm } from '@/components/branches/BranchForm'
import { getBranchColumns } from '@/components/branches/Columns'
import { useAuth } from '@/contexts/AuthContext'
import { branchApi, BranchSearchParams } from '@/api/branchApi'
import { useToast } from '@/hooks/use-toast'

import { Branch, Pagination } from '@/types'
import { AxiosError } from 'axios'

// Функция для получения списка филиалов с пагинацией
const fetchBranches = async (page = 1, pageSize = 10): Promise<{ data: Branch[]; pagination: Pagination }> => {
    const response = await branchApi.getAll(page, pageSize)
    return response.data
}

// Функция для поиска филиалов по названию
const searchBranches = async (searchValue: string): Promise<Branch[]> => {
    const params: BranchSearchParams = { name: searchValue }
    const response = await branchApi.search(params)
    return response.data.data
}

export function BranchesPage() {
    const { toast } = useToast()
    const { user } = useAuth()
    const queryClient = useQueryClient()

    // Состояния для управления формой, редактированием и поиском
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingBranch, setEditingBranch] = useState<Branch | undefined>(undefined)
    const [searchValue, setSearchValue] = useState('')
    const [pagePagination, setPagePagination] = useState({ pageIndex: 0, pageSize: 10 })

    const isAdmin = user?.role === 'admin'

    // Запрос для получения филиалов с пагинацией
    const {
        data: branchesResponse,
        isLoading,
        error
    } = useQuery({
        queryKey: ['branches', pagePagination.pageIndex + 1, pagePagination.pageSize],
        queryFn: () => fetchBranches(pagePagination.pageIndex + 1, pagePagination.pageSize),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000 // Данные считаются свежими 5 минут
    })

    // Запрос для поиска филиалов
    const { data: searchResults } = useQuery({
        queryKey: ['branches', 'search', searchValue],
        queryFn: () => searchBranches(searchValue),
        enabled: Boolean(searchValue.trim()),
        staleTime: 2 * 60 * 1000 // Данные поиска свежи 2 минуты
    })

    // Мутация для удаления филиала
    const deleteMutation = useMutation({
        mutationFn: (id: number) => branchApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] })
            toast({ title: 'Филиал удалён', description: 'Филиал успешно удалён.' })
        },
        onError: (err: AxiosError) => {
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: `Не удалось удалить филиал: ${err.message}`
            })
        }
    })

    // Мемоизация функции удаления
    const handleDelete = useMemo(() => {
        return (branch: Branch) => {
            deleteMutation.mutate(branch.id)
        }
    }, [deleteMutation])

    // Мемоизация функции редактирования
    const handleEdit = useMemo(() => {
        return (branch: Branch) => {
            setEditingBranch(branch)
            setIsFormOpen(true)
        }
    }, [])

    // Мемоизация колонок таблицы
    const columns = useMemo(() => getBranchColumns(handleEdit, handleDelete), [handleEdit, handleDelete])
    const displayData = searchValue.trim() && searchResults ? searchResults : branchesResponse?.data || []
    const filteredColumns = isAdmin ? columns : columns.filter(col => col.id !== 'actions')

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
    if (isLoading && !branchesResponse?.data.length) {
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
                <p>Ошибка загрузки филиалов: {error.message}</p>
            </motion.div>
        )
    }

    return (
        <div className='space-y-8'>
            {/* Заголовок и кнопка добавления филиала */}
            <motion.div
                className='flex items-center justify-between'
                variants={containerVariants}
                initial='hidden'
                animate='visible'
            >
                <motion.h2 variants={itemVariants} className='text-3xl font-bold tracking-tight'>
                    Филиалы
                </motion.h2>
                {isAdmin && (
                    <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={() => {
                                setEditingBranch(undefined)
                                setIsFormOpen(true)
                            }}
                        >
                            <Plus className='mr-2 h-4 w-4' />
                            Добавить филиал
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
                    rowCount={!searchValue.trim() ? branchesResponse?.pagination?.total_records : undefined}
                    searchPlaceholder='Поиск по названию...'
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

            {/* Диалог для добавления/редактирования филиала */}
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
                                <DialogTitle>{editingBranch ? 'Редактировать филиал' : 'Добавить филиал'}</DialogTitle>
                            </DialogHeader>
                            <motion.div variants={dialogContentVariants} initial='hidden' animate='visible' exit='exit'>
                                <BranchForm
                                    branch={editingBranch}
                                    onSuccess={() => {
                                        setIsFormOpen(false)
                                        setEditingBranch(undefined)
                                        queryClient.invalidateQueries({ queryKey: ['branches'] })
                                        toast({ title: 'Филиал сохранён', description: 'Филиал успешно сохранён.' })
                                    }}
                                    onCancel={() => {
                                        setIsFormOpen(false)
                                        setEditingBranch(undefined)
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
