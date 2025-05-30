import { useEffect, useState } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface DataTableProps<TData> {
    columns: ColumnDef<TData>[]
    data: TData[]
    searchPlaceholder?: string
    searchKey?: string
    onRowClick?: (row: TData) => void
    isLoading?: boolean
    handleChangeSearch?: (val: string) => void
    rowCount?: number
    pageSize: number
    handleChangePagination: (pagination: { pageIndex: number; pageSize: number }) => void
}

export function DataTable<TData>({
    columns,
    data,
    searchPlaceholder = 'Поиск...',
    searchKey,
    onRowClick,
    isLoading = false,
    handleChangeSearch,
    rowCount = 0,
    pageSize,
    handleChangePagination
}: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [localFilter, setLocalFilter] = useState('')
    const [pageIndex, setPageIndex] = useState(0)

    useEffect(() => {
        if (handleChangeSearch) {
            handleChangeSearch(localFilter)
        }
    }, [localFilter, handleChangeSearch])

    useEffect(() => {
        handleChangePagination({ pageIndex, pageSize })
    }, [pageIndex, pageSize, handleChangePagination])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            globalFilter
        },
        manualPagination: true,
        pageCount: Math.ceil(rowCount / pageSize)
    })

    useEffect(() => {
        setPageIndex(0)
    }, [globalFilter])

    const handlePreviousPage = () => {
        setPageIndex(prev => Math.max(prev - 1, 0))
    }

    const handleNextPage = () => {
        setPageIndex(prev => Math.min(prev + 1, table.getPageCount() - 1))
    }

    return (
        <div className='w-full space-y-4'>
            {searchKey && (
                <div className='relative'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        placeholder={searchPlaceholder}
                        value={localFilter ?? ''}
                        onChange={e => setLocalFilter(e.target.value)}
                        className='pl-10'
                    />
                </div>
            )}

            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    Загрузка...
                                </TableCell>
                            </TableRow>
                        ) : data?.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    onClick={() => onRowClick && onRowClick(row.original)}
                                    className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    Нет данных
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                    Показано с {pageIndex * pageSize + 1} по {Math.min((pageIndex + 1) * pageSize, rowCount)} из{' '}
                    {rowCount}
                </div>
                <div className='flex items-center space-x-2'>
                    <Button variant='outline' size='sm' onClick={handlePreviousPage} disabled={pageIndex === 0}>
                        <ChevronLeft className='h-4 w-4' />
                    </Button>
                    <div className='text-sm font-medium'>
                        Страница {pageIndex + 1} из {table.getPageCount()}
                    </div>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={handleNextPage}
                        disabled={pageIndex >= table.getPageCount() - 1}
                    >
                        <ChevronRight className='h-4 w-4' />
                    </Button>
                </div>
            </div>
        </div>
    )
}
