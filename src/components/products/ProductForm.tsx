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


const MAX_FILE_SIZE = 1024 * 1024 * 5;
const ACCEPTED_IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const formSchema = z.object({
    name: z.string().min(1, 'Обязательное поле'),
    barcode: z.string().min(1, 'Обязательное поле'),
    real_price: z
      .string()
      .transform(val => (val === '' ? 0 : Number(val))) // Transform empty string to 0, otherwise to number
      .refine(val => !isNaN(val), { message: 'Цена должна быть числом' })
      .refine(val => val >= 0, { message: 'Цена должна быть 0 или больше' }),
    price: z
        .string()
        .transform(val => (val === '' ? 0 : Number(val))) // Transform empty string to 0, otherwise to number
        .refine(val => !isNaN(val), { message: 'Цена должна быть числом' })
        .refine(val => val >= 0, { message: 'Цена должна быть 0 или больше' }),
    stock: z
        .string()
        .transform(val => (val === '' ? 0 : Number(val))) // Transform empty string to 0, otherwise to number
        .refine(val => !isNaN(val), { message: 'Количество должно быть числом' })
        .refine(val => val >= 0, { message: 'Количество должно быть 0 или больше' }),
    description: z.string().optional(),
    images: z
        .any()
        .refine((files) => {
            return files?.[0]?.size <= MAX_FILE_SIZE || 10;
        }, `Max image size is 5MB.`)
        .refine(
            (files) => ACCEPTED_IMAGE_MIME_TYPES.includes(files?.[0]?.type),
            "Only .jpg, .jpeg, .png and .webp formats are supported."
        )
        .optional(),
    branch_id: z
        .string()
        .transform(val => Number(val))
        .refine(val => val >= 1, { message: 'Филиал должен быть выбран' })
})

type ZodFormData = z.infer<typeof formSchema>

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

    // Mutation for creating a product
    const createMutation = useMutation({
        mutationFn: (data: FormData) => productApi.create(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['products'] })
        }
    })

    // Mutation for updating a product
    const updateMutation = useMutation({
        mutationFn: (data: FormData) => productApi.update(product!.barcode, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['products'] })
        }
    })

    const defaultValues: ZodFormData = {
        name: product?.name || '',
        barcode: product?.barcode || '',
        real_price: String(product?.real_price || 0),
        price: String(product?.price || 0),
        stock: String(product?.stock || 0),
        description: product?.description || '',
        branch_id: String(product?.branch_id) || branches.length ? String(branches[0].id) : "",
    }

    const form = useForm<ZodFormData>({
        resolver: zodResolver(formSchema),
        defaultValues
    })

    const onSubmit = async (data: ZodFormData) => {
        setIsSubmitting(true)

        const bodyFormData = new FormData();
        bodyFormData.append('name', data.name);
        bodyFormData.append('barcode', data.barcode);
        bodyFormData.append('price', Number(data.price));
        bodyFormData.append('real_price', Number(data.real_price));
        bodyFormData.append('stock', Number(data.stock));
        bodyFormData.append('description', data.description);
        bodyFormData.append('branch_id', Number(data.branch_id));

        for (let i = 0; i < data.images?.length; i++) {
            bodyFormData.append('images', data.images[i]);
        }

        try {
            if (product) {
                // Update existing product
                const response = await updateMutation.mutateAsync(bodyFormData)
                if (response.data.statusCode > 201) {
                    throw new Error('Ошибка при обновлении товара')
                }
                toast({
                    title: 'Товар обновлен',
                    description: `${data.name} был успешно обновлен.`
                })
            } else {
                // Create new product
                const response = await createMutation.mutateAsync(bodyFormData)
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
                        <FormItem className={'flex flex-col justify-between'}>
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
                            <FormItem className={'flex flex-col justify-between'}>
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
                            <FormItem className={'flex flex-col justify-between'}>
                                <FormLabel>Количество на складе</FormLabel>
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
                      <FormLabel>TODO: Изображения (необязательно)</FormLabel>
                      <FormControl>
                        <Input
                            type='file'
                            multiple={true}
                            onChange={(e) => {
                                field.onChange(e.target.files);
                            }}
                        />
                      </FormControl>
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