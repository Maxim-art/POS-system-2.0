// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useForm } from 'react-hook-form'
// import { z } from 'zod'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { useAuth } from '@/contexts/AuthContext'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Card, CardContent,  CardHeader } from '@/components/ui/card'
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
// import { useToast } from '@/hooks/use-toast'
// import { Eye, EyeOff } from 'lucide-react'

// import logo from '../../public/logo.png'


// const formSchema = z.object({
//     login: z.string().min(1, 'Логин обязателен'),
//     password: z.string().min(1, 'Пароль обязателен')
// })

// type FormData = z.infer<typeof formSchema>

// export function LoginPage() {
//     const { login } = useAuth()
//     const { toast } = useToast()
//     const navigate = useNavigate()
//     const [isLoading, setIsLoading] = useState(false)

//     const form = useForm<FormData>({
//         resolver: zodResolver(formSchema),
//         defaultValues: {
//             login: '',
//             password: ''
//         }
//     })

//     const onSubmit = async (data: FormData) => {
//         setIsLoading(true)

//         try {
//             await login(data.login, data.password)
//             navigate('/dashboard')
//         } catch (error) {
//             toast({
//                 title: 'Ошибка входа',
//                 description: 'Неверный логин или пароль',
//                 variant: 'destructive'
//             })
//         } finally {
//             setIsLoading(false)
//         }
//     }

//     const [showPassword, setShowPassword] = useState(false)

//     return (
//         <div className='flex min-h-screen  items-center justify-center bg-secondary/30 p-4'>
//             <Card className='w-1/3 shadow-lg'>
//                 <CardHeader className='space-y-1'>
//                     <div className='flex justify-center mb-6'>
//                         <div className='flex items-center space-x-2 text-primary'>
//                             <img src={logo} alt='' className='h-6 w-6' />
//                             <span className='text-2xl font-bold'>Подружки</span>
//                         </div>
//                     </div>
                   
//                 </CardHeader>
//                 <CardContent>
//                     <Form {...form}>
//                         <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
//                             <FormField
//                                 control={form.control}
//                                 name='login'
//                                 render={({ field }) => (
//                                     <FormItem>
//                                         <FormLabel>Логин</FormLabel>
//                                         <FormControl>
//                                             <Input
//                                                 type='text'
//                                                 placeholder='Введите ваш логин'
//                                                 {...field}
//                                                 autoComplete='username'
//                                             />
//                                         </FormControl>
//                                         <FormMessage />
//                                     </FormItem>
//                                 )}
//                             />

//                             <FormField
//                                 control={form.control}
//                                 name='password'
//                                 render={({ field }) => {
//                                     return (
//                                         <FormItem>
//                                             <FormLabel>Пароль</FormLabel>
//                                             <FormControl>
//                                                 <div className='relative'>
//                                                     <Input
//                                                         type={showPassword ? 'text' : 'password'}
//                                                         placeholder='Введите ваш пароль'
//                                                         {...field}
//                                                         autoComplete='current-password'
//                                                     />
//                                                     <button
//                                                         type='button'
//                                                         className='absolute right-2 top-1 text-muted-foreground hover:text-primary'
//                                                         onClick={() => setShowPassword(!showPassword)}
//                                                     >
//                                                         {showPassword ? (
//                                                             <EyeOff className='h-2 w-2' />
//                                                         ) : (
//                                                             <Eye className='h-2 w-2' />
//                                                         )}
//                                                     </button>
//                                                 </div>
//                                             </FormControl>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )
//                                 }}
//                             />
//                             <Button type='submit' className='w-full' disabled={isLoading}>
//                                 {isLoading ? 'Вход...' : 'Войти'}
//                             </Button>
//                         </form>
//                     </Form>
//                 </CardContent>
//             </Card>
//         </div>
//     )
// }


import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff } from 'lucide-react'

import logo from '../../public/logo.png'

const formSchema = z.object({
  login: z.string().min(1, 'Логин обязателен'),
  password: z.string().min(1, 'Пароль обязателен')
})

type FormData = z.infer<typeof formSchema>

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

const contentVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      login: '',
      password: ''
    }
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)

    try {
      await login(data.login, data.password)
      navigate('/dashboard')
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: 'Неверный логин или пароль',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-secondary/30 p-4'>
      <motion.div
        className='w-full max-w-md'
        variants={cardVariants}
        initial='hidden'
        animate='show'
      >
        <Card className='shadow-lg'>
          <CardHeader className='space-y-1'>
            <motion.div
              className='flex justify-center mb-6'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className='flex items-center space-x-2 text-primary'>
                <img src={logo} alt='' className='h-6 w-6' />
                <span className='text-2xl font-bold'>Подружки</span>
              </div>
            </motion.div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <motion.form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
                variants={contentVariants}
                initial='hidden'
                animate='show'
              >
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='login'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Логин</FormLabel>
                        <FormControl>
                          <Input
                            type='text'
                            placeholder='Введите ваш логин'
                            {...field}
                            autoComplete='username'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder='Введите ваш пароль'
                              {...field}
                              autoComplete='current-password'
                            />
                            <Button
                            variant='outline'
                              type='button'
                              className='absolute right-0 top-0 text-muted-foreground hover:text-primary'
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className='h-4 w-4' />
                              ) : (
                                <Eye className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Вход...' : 'Войти'}
                  </Button>
                </motion.div>
              </motion.form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
