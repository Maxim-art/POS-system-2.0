import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Branch, Product } from '@/types/api.ts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { productApi } from '@/api/productApi'

const formSchema = z.object({
    name: z.string().min(1, 'Обязательное поле'),
    barcode: z.string().min(1, 'Обязательное поле'),
    real_price: z
        .string()
        .transform(val => (val === '' ? 0 : Number(val)))
        .refine(val => !isNaN(val), { message: 'Цена должна быть числом' })
        .refine(val => val >= 0, { message: 'Цена должна быть 0 или больше' }),
    price: z
        .string()
        .transform(val => (val === '' ? 0 : Number(val)))
        .refine(val => !isNaN(val), { message: 'Цена должна быть числом' })
        .refine(val => val >= 0, { message: 'Цена должна быть 0 или больше' }),
    stock: z
        .string()
        .transform(val => (val === '' ? 0 : Number(val)))
        .refine(val => !isNaN(val), { message: 'Количество должно быть числом' })
        .refine(val => val >= 0, { message: 'Количество должно быть 0 или больше' }),
    description: z.string().optional(),
    branch_id: z
        .string()
        .transform(val => Number(val))
        .refine(val => val >= 1, { message: 'Филиал должен быть выбран' }),
    images: z
        .array(z.instanceof(File))
        .optional()
        .refine(files => !files || files.every(file => file.type.startsWith('image/')), {
            message: 'Только изображения разрешены'
        })
        .refine(files => !files || files.length <= 5, {
            message: 'Максимум 5 изображений'
        })
})

type FormData = z.infer<typeof formSchema>

interface ProductFormProps {
    product?: Product
    branches: Branch[]
    onSuccess: () => void
    onCancel: () => void
}

export function ProductForm({ product, branches, onSuccess, onCancel }: ProductFormProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const queryClient = useQueryClient()

    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    const createMutation = useMutation({
        mutationFn: (data: FormData) => {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('barcode', data.barcode)
            formData.append('price', String(data.price))
            formData.append('real_price', String(data.real_price))
            formData.append('stock', String(data.stock))
            formData.append('branch_id', String(data.branch_id))
            if (data.description) {
                formData.append('description', data.description)
            }
            if (data.images) {
                data.images.forEach(file => formData.append('images', file))
            }
            return productApi.create(formData)
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['products'] })
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: FormData) => {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('barcode', data.barcode)
            formData.append('price', String(data.price))
            formData.append('real_price', String(data.real_price))
            formData.append('stock', String(data.stock))
            formData.append('branch_id', String(data.branch_id))
            if (data.description) {
                formData.append('description', data.description)
            }
            if (data.images) {
                data.images.forEach(file => formData.append('images', file))
            }
            return productApi.update(product!.barcode, formData)
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['products'] })
        }
    })

    const defaultValues: FormData = {
        name: product?.name || '',
        barcode: product?.barcode || '',
        real_price: String(product?.real_price || 0),
        price: String(product?.price || 0),
        stock: String(product?.stock || 0),
        description: product?.description || '',
        branch_id: String(product?.branch_id) || (branches.length ? String(branches[0].id) : ''),
        images: []
    }

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues
    })

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true)
        try {
            if (product) {
                const response = await updateMutation.mutateAsync(data)
                if (response.data.statusCode > 201) {
                    throw new Error('Ошибка при обновлении товара')
                }
                toast({
                    title: 'Товар обновлен',
                    description: `${data.name} был успешно обновлен.`
                })
            } else {
                const response = await createMutation.mutateAsync(data)
                if (response.data.statusCode > 201) {
                    throw new Error('Ошибка при создании товара')
                }
                toast({
                    title: 'Товар создан',
                    description: `${data.name} был успешно создан.`
                })
            }
            onSuccess()
        } catch (error: any) {
            toast({
                title: 'Ошибка',
                description: error.message || 'Произошла ошибка при сохранении товара.',
                variant: 'destructive'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Название товара</FormLabel>
                            <FormControl>
                                <Input placeholder='Введите название товара' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='barcode'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Штрих-код</FormLabel>
                            <FormControl>
                                <Input placeholder='Введите штрих-код' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='branch_id'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Филиал</FormLabel>
                            <Select onValueChange={field.onChange} value={String(field.value)}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Выберите филиал' />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {branches.map(branch => (
                                        <SelectItem key={String(branch.id)} value={String(branch.id)}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
                    <FormField
                        control={form.control}
                        name='real_price'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Закупочная цена</FormLabel>
                                <FormControl>
                                    <Input type='number' min={0} step={0.01} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='price'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Рыночная цена</FormLabel>
                                <FormControl>
                                    <Input type='number' min={0} step={0.01} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='stock'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Кол-во на складе</FormLabel>
                                <FormControl>
                                    <Input type='number' min={0} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name='images'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Изображения (необязательно)</FormLabel>
                            <FormControl>
                                {/* <Input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={e => {
                    const files = Array.from(e.target.files || [])
                    field.onChange(files)
                  }}
                /> */}
                                <Input
                                    type='file'
                                    accept='image/*'
                                    multiple
                                    onChange={e => {
                                        const files = Array.from(e.target.files || [])
                                        field.onChange(files)

                                        const previews = files.map(file => URL.createObjectURL(file))
                                        setImagePreviews(previews)
                                    }}
                                />
                            </FormControl>
                            {imagePreviews.length > 0 && (
                                <div className='mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4'>
                                    {imagePreviews.map((src, index) => (
                                        <img
                                            key={index}
                                            src={src}
                                            alt={`preview-${index}`}
                                            className='w-full h-auto rounded border'
                                        />
                                    ))}
                                </div>
                            )}

                            {field.value && field.value.length > 0 && (
                                <div className='mt-2'>
                                    <p>Выбранные файлы:</p>
                                    <ul className='list-disc pl-5'>
                                        {field.value.map((file, index) => (
                                            <li key={index}>{file.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Описание (необязательно)</FormLabel>
                            <FormControl>
                                <Textarea placeholder='Введите описание товара' className='resize-none' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className='flex justify-end space-x-2'>
                    <Button type='button' variant='outline' onClick={onCancel}>
                        Отмена
                    </Button>
                    <Button type='submit' disabled={isSubmitting}>
                        {isSubmitting ? 'Сохранение...' : product ? 'Обновить товар' : 'Создать товар'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
