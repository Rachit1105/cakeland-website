import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '40');
        const offset = (page - 1) * limit;

        // Get total count
        const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .not('embedding', 'is', null);

        if (countError) {
            console.error('Count error:', countError);
            return NextResponse.json({ error: 'Failed to count products' }, { status: 500 });
        }

        // Get paginated products (with thumbnail URLs for faster loading)
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, image_url, thumbnail_url')
            .not('embedding', 'is', null)
            .order('id', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        return NextResponse.json({
            products: products || [],
            total: count || 0,
            hasMore: offset + limit < (count || 0),
            currentPage: page
        });

    } catch (error: any) {
        console.error('Products API error:', error);
        return NextResponse.json({
            error: 'Failed to fetch products',
            details: error.message
        }, { status: 500 });
    }
}
