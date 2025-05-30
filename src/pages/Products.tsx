import { useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, LoaderPinwheel } from 'lucide-react'
import { Product } from '@/types/api.ts'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { productApi, ProductSearchParams } from '@/api/productApi'
import { branchApi } from '@/api/branchApi'
import { DataTable } from '@/components/common/DataTable'
import { ProductForm } from '@/components/products/ProductForm'
import { createProductColumns } from '@/components/products/Columns'

const fetchProducts = async (page: number = 1, pageSize: number = 10): Promise<Product[]> => {
    try {
        const response = await productApi.getAll(page, pageSize)
        return response.data
    } catch (error) {
        throw new Error('Не удалось загрузить продукты: ' + error.message)
    }
}

const fetchBranches = async () => {
    const response = await branchApi.getAll()
    return response.data
}

const searchProducts = async (searchValue: string): Promise<Product[]> => {
    try {
        const params: ProductSearchParams = { q: searchValue }
        const response = await productApi.search(params)
        return response.data
    } catch (error) {
        throw new Error('Не удалось выполнить поиск продуктов: ' + error.message)
    }
}

export function ProductsPage() {
    const { toast } = useToast()
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
    const [searchValue, setSearchValue] = useState('')

    const [pagePagination, setPagePagination] = useState({
        pageIndex: 0,
        pageSize: 10
    })

    const isAdmin = user?.role === 'admin'

    // Получение продуктов
    const {
        data: dataProducts,
        isLoading,
        error
    } = useQuery({
        queryKey: ['products', pagePagination.pageIndex + 1],
        queryFn: () =>
            fetchProducts(
                pagePagination.pageIndex + 1,
                pagePagination.pageSize
            ),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000
    })

    // Получение филиалов
    const { data: dataBranches } = useQuery({
        queryKey: ['branches'],
        queryFn: fetchBranches,
        staleTime: 10 * 60 * 1000
    })

    // Поиск продуктов
    const { data: searchResults } = useQuery({
        queryKey: ['products', 'search', searchValue],
        queryFn: () => searchProducts(searchValue),
        enabled: Boolean(searchValue.trim()),
        staleTime: 2 * 60 * 1000
    })

    // Мутация для удаления продукта
    const deleteMutation = useMutation({
        mutationFn: (barcode: string) => productApi.delete(barcode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast({
                title: 'Продукт удален',
                description: 'Продукт успешно удален.'
            })
        },
        onError: (error: any) => {
            console.error('Delete failed:', error)
            toast({
                title: 'Ошибка',
                description: 'Не удалось удалить продукт: ' + error.message,
                variant: 'destructive'
            })
        }
    })

    // Создаем стабильные функции с useCallback или определяем их внутри useMemo
    const handleDelete = useMemo(() => {
        return (product: Product) => {
            console.log('handleDelete called with:', product)
            deleteMutation.mutate(product.barcode)
        }
    }, [deleteMutation])

    const handleEdit = useMemo(() => {
        return (product: Product) => {
            console.log('handleEdit called with:', product)
            setEditingProduct(product)
            setIsFormOpen(true)
        }
    }, [])

    // Создание колонок с мемоизацией
    const columns = useMemo(() => {
        console.log('Creating columns with functions:', { handleEdit, handleDelete })
        return createProductColumns(handleEdit, handleDelete, dataBranches?.data || [])
    }, [handleEdit, handleDelete, dataBranches?.data])

    // Данные для отображения
    const displayData = searchValue.trim() && searchResults ? searchResults : dataProducts?.data || []

    // Загрузка
    if (isLoading) {
        return (
            <div className='flex justify-center items-center min-h-[400px]'>
                <LoaderPinwheel className='h-8 w-8 animate-spin' />
            </div>
        )
    }

    // Обработка ошибок
    if (error) {
        return (
            <div className='text-center text-destructive p-8'>
                <p>Ошибка загрузки продуктов: {error.message}</p>
            </div>
        )
    }

    // Скрытие колонки действий для не-админов
    const filteredColumns = isAdmin ? columns : columns.filter(col => col.id !== 'actions')

    return (
        <div className='space-y-8'>
            <div className='flex items-center justify-between'>
                <h2 className='text-3xl font-bold tracking-tight'>Продукты</h2>
                {isAdmin && (
                    <Button
                        onClick={() => {
                            setEditingProduct(undefined)
                            setIsFormOpen(true)
                        }}
                    >
                        <Plus className='mr-2 h-4 w-4' />
                        Добавить продукт
                    </Button>
                )}
            </div>

            <DataTable
                columns={filteredColumns}
                data={displayData}
                rowCount={!searchValue.trim() ? dataProducts?.pagination?.total_records : undefined}
                searchPlaceholder='Поиск по названию...'
                searchKey='name'
                isLoading={isLoading}
                handleChangeSearch={setSearchValue}
                pageSize={pagePagination.pageSize}
                handleChangePagination={setPagePagination}
                onRowClick={isAdmin ? handleEdit : undefined}
            />

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? 'Редактировать продукт' : 'Добавить продукт'}
                        </DialogTitle>
                    </DialogHeader>
                    <ProductForm
                        product={editingProduct}
                        branches={dataBranches?.data ?? []}
                        onSuccess={() => {
                            setIsFormOpen(false)
                            setEditingProduct(undefined)
                            queryClient.invalidateQueries({ queryKey: ['products'] })
                        }}
                        onCancel={() => {
                            setIsFormOpen(false)
                            setEditingProduct(undefined)
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}