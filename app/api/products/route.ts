import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

export async function GET() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, image_url')
            .not('embedding', 'is', null)
            .order('id', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        return NextResponse.json({ products: products || [] });

    } catch (error: any) {
        console.error('Products API error:', error);
        return NextResponse.json({
            error: 'Failed to fetch products',
            details: error.message
        }, { status: 500 });
    }
}
