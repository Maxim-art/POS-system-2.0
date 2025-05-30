// import { ColumnDef } from '@tanstack/react-table'
// import { Button } from '@/components/ui/button'
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger
// } from '@/components/ui/dropdown-menu'
// import { Edit, MoreHorizontal, Trash } from 'lucide-react'
// import { Product } from '@/types/api.ts'
// import { formatCurrency } from '@/lib/utils'

// export function createProductColumns(
//     onEdit: (product: Product) => void,
//     onDelete: (product: Product) => void,
//     branches: any[] = []
// ): ColumnDef<Product>[] {
//     // Проверяем, что функции переданы правильно
//     console.log('createProductColumns called with:', { onEdit, onDelete, branches })
    
//     return [
//         {
//             accessorKey: 'name',
//             header: 'Название',
//             cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>
//         },
//         {
//             accessorKey: 'barcode',
//             header: 'Баркод'
//         },
//         {
//             accessorKey: 'price',
//             header: 'Цена',
//             cell: ({ row }) => {
//                 const price = row.getValue('price')
//                 return formatCurrency(parseFloat(price as string))
//             }
//         },
//         {
//             accessorKey: 'stock',
//             header: 'Остаток'
//         },
//         {
//             accessorKey: 'branch_id',
//             header: 'Филиал',
//             cell: ({ row }) => {
//                 let branchesData = branches
//                 if (branches?.data) {
//                     branchesData = branches.data
//                 }
//                 const branchId = row.getValue('branch_id')
//                 const branch = branchesData.find((b: any) => b.id === branchId)
//                 return branch?.name || 'Неизвестный филиал'
//             }
//         },
//         {
//             accessorKey: 'description',
//             header: 'Описание',
//             cell: ({ row }) => {
//                 const description = row.getValue('description') as string
//                 return (
//                     <div className='max-w-xs truncate' title={description}>
//                         {description}
//                     </div>
//                 )
//             }
//         },
//         {
//             accessorKey: 'created_at',
//             header: 'Дата создания',
//             cell: ({ row }) => {
//                 const date = row.getValue('created_at') as string
//                 return new Date(date).toLocaleDateString('ru-RU')
//             }
//         },
//         {
//             id: 'actions',
//             header: () => <div className='text-right'>Действия</div>,
//             cell: ({ row }) => {
//                 const product = row.original

//                 // Проверяем функции внутри cell
//                 if (typeof onEdit !== 'function' || typeof onDelete !== 'function') {
//                     console.error('onEdit or onDelete is not a function:', { onEdit, onDelete })
//                     return null
//                 }

//                 return (
//                     <div className='flex justify-end'>
//                         <DropdownMenu>
//                             <DropdownMenuTrigger asChild>
//                                 <Button 
//                                     variant='outline' 
//                                     size='sm'
//                                     className='h-8 w-8 p-0' 
//                                     onClick={(e) => {
//                                         e.stopPropagation()
//                                     }}
//                                 >
//                                     <span className='sr-only'>Открыть меню</span>
//                                     <MoreHorizontal className='h-4 w-4' />
//                                 </Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent align='end'>
//                                 <DropdownMenuLabel>Действия</DropdownMenuLabel>
//                                 <DropdownMenuSeparator />
//                                 <DropdownMenuItem
//                                     onClick={(e) => {
//                                         e.stopPropagation()
//                                         console.log('Edit clicked for product:', product)
//                                         onEdit(product)
//                                     }}
//                                 >
//                                     <Edit className='mr-2 h-4 w-4' />
//                                     <span>Редактировать</span>
//                                 </DropdownMenuItem>
//                                 <DropdownMenuItem
//                                     onClick={(e) => {
//                                         e.stopPropagation()
//                                         console.log('Delete clicked for product:', product)
//                                         onDelete(product)
//                                     }}
//                                     className='text-destructive focus:text-destructive'
//                                 >
//                                     <Trash className='mr-2 h-4 w-4' />
//                                     <span>Удалить</span>
//                                 </DropdownMenuItem>
//                             </DropdownMenuContent>
//                         </DropdownMenu>
//                     </div>
//                 )
//             },
//             enableSorting: false
//         }
//     ]
// }


import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal, Trash } from 'lucide-react'
import { Product } from '@/types/api.ts'
import { formatCurrency } from '@/lib/utils'

export function createProductColumns(
    onEdit: (product: Product) => void,
    onDelete: (product: Product) => void,
    branches: any[] = []
): ColumnDef<Product>[] {
    // Проверяем, что функции переданы правильно
    console.log('createProductColumns called with:', { onEdit, onDelete, branches })
    
    return [
        {
            accessorKey: 'name',
            header: 'Название',
            cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>
        },
        {
            accessorKey: 'barcode',
            header: 'Баркод'
        },
        {
            accessorKey: 'price',
            header: 'Цена',
            cell: ({ row }) => {
                const price = row.getValue('price')
                return formatCurrency(parseFloat(price as string))
            }
        },
        {
            accessorKey: 'stock',
            header: 'Остаток'
        },
        {
            accessorKey: 'branch_id',
            header: 'Филиал',
            cell: ({ row }) => {
                let branchesData = branches
                if (branches?.data) {
                    branchesData = branches.data
                }
                const branchId = row.getValue('branch_id')
                const branch = branchesData.find((b: any) => b.id === branchId)
                return branch?.name || 'Неизвестный филиал'
            }
        },
        {
            accessorKey: 'description',
            header: 'Описание',
            cell: ({ row }) => {
                const description = row.getValue('description') as string
                return (
                    <div className='max-w-xs truncate' title={description}>
                        {description}
                    </div>
                )
            }
        },
        {
            accessorKey: 'image',
            header: 'Фото',
            cell: ({ row }) => {
                const images = row.getValue('image') as string[]
                if (!images || images.length === 0) {
                    return <div className='text-gray-400'>Нет фото</div>
                }
                
                return (
                    <div className='w-16 h-16'>
                        <img 
                            src={images[0]} 
                            alt="Фото товара" 
                            className='w-full h-full object-cover rounded'
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                                const fallback = document.createElement('div')
                                fallback.className = 'w-16 h-16 flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs'
                                fallback.textContent = 'Ошибка загрузки'
                                e.currentTarget.parentNode?.appendChild(fallback)
                            }}
                        />
                    </div>
                )
            },
            enableSorting: false
        },
        {
            accessorKey: 'created_at',
            header: 'Дата создания',
            cell: ({ row }) => {
                const date = row.getValue('created_at') as string
                return new Date(date).toLocaleDateString('ru-RU')
            }
        },
        {
            id: 'actions',
            header: () => <div className='text-right'>Действия</div>,
            cell: ({ row }) => {
                const product = row.original

                // Проверяем функции внутри cell
                if (typeof onEdit !== 'function' || typeof onDelete !== 'function') {
                    console.error('onEdit or onDelete is not a function:', { onEdit, onDelete })
                    return null
                }

                return (
                    <div className='flex justify-end'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant='outline' 
                                    size='sm'
                                    className='h-8 w-8 p-0' 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                    }}
                                >
                                    <span className='sr-only'>Открыть меню</span>
                                    <MoreHorizontal className='h-4 w-4' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        console.log('Edit clicked for product:', product)
                                        onEdit(product)
                                    }}
                                >
                                    <Edit className='mr-2 h-4 w-4' />
                                    <span>Редактировать</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        console.log('Delete clicked for product:', product)
                                        onDelete(product)
                                    }}
                                    className='text-destructive focus:text-destructive'
                                >
                                    <Trash className='mr-2 h-4 w-4' />
                                    <span>Удалить</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            enableSorting: false
        }
    ]
}