'use server'

import { z } from 'zod'

import { Invoice } from './definitions';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'

const CreateInvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.date()
})

const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
    id: true,
    date: true
})

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoiceFormSchema.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    //transformamos para evitar errores de redondeo
    const amountInCents = amount * 100
    //Creamos la fecha actual
    const [date] = new Date().toISOString().split('T');
    //Aquí usamos la desestructuración, y le estamos diciendo que en la primera parte solo queremos el date(2023-11-23)


    await sql`
        INSERT INTO invoices (customer_id,amount,status,date)
        VALUES (${customerId},${amountInCents},${status},${date})
    `

    //Indicarle qué ruta debe refrescar
    revalidatePath('/dashboard/invoices')
    //Redirigir a la página de facturas
    redirect('/dashboard/invoices')
}