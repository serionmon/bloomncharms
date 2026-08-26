import { getAdminSupabaseClient, getAnonSupabaseClient } from '../common/supabase.js';
import { config } from '../common/config.js';

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  alt: string;
  description: string;
  stock: number;
  available: boolean;
  badge?: string;
  tag?: string;
  isCustomizable?: boolean;
  isFeatured?: boolean;
  processingDays?: number;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

// Fallback seed catalog for local resilience when Supabase credentials are not connected
const SEED_CATEGORIES: CategoryDTO[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Bouquets', slug: 'bouquets', description: 'Everlasting handcrafted bouquets' },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'Flowers', slug: 'flowers', description: 'Single sculpted botanical stems' },
  { id: 'a0000000-0000-0000-0000-000000000003', name: 'Keyrings', slug: 'keyrings', description: 'Floral charms and keepsakes' },
  { id: 'a0000000-0000-0000-0000-000000000004', name: 'Charms', slug: 'charms', description: 'Clip-on miniature blossom accents' },
  { id: 'a0000000-0000-0000-0000-000000000005', name: 'Gift Sets', slug: 'gift-sets', description: 'Curated gift boxes and duos' },
];

const SEED_PRODUCTS: ProductDTO[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    slug: 'signature-bloom-bouquet',
    name: 'Signature Bloom Bouquet',
    subtitle: 'Chenille-stem & silk wrap',
    category: 'bouquets',
    price: 1299,
    currency: '₹',
    image: '/images/products/signature-bloom-bouquet.jpg',
    alt: 'Handmade Signature Bloom Bouquet crafted from chenille stems and wrapped in raw silk by Bloomncharms.',
    description: 'Our quintessential arrangement, meticulously sculpted petal by petal from premium velvety chenille stems and wrapped in artisanal kraft linen. A timeless centrepiece designed to hold memories.',
    stock: 8,
    available: true,
    badge: 'Bestseller',
    tag: 'Bestseller',
    isCustomizable: true,
    isFeatured: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    slug: 'mini-pastel-bouquet',
    name: 'Mini Pastel Bouquet',
    subtitle: 'Delicate posy arrangement',
    category: 'bouquets',
    price: 699,
    currency: '₹',
    image: '/images/products/mini-pastel-bouquet.jpg',
    alt: 'Handmade Mini Pastel flower bouquet tied with twine by Bloomncharms.',
    description: 'A delicate posy of pastel blossoms, handcrafted for small gestures and bedside tables. Created slowly using soft blush and cream tones tied with natural twine.',
    stock: 12,
    available: true,
    badge: 'New',
    tag: 'New',
    isCustomizable: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    slug: 'rose-bloom-bouquet',
    name: 'Rose Bloom Bouquet',
    subtitle: 'Crimson & blush velvet roses',
    category: 'bouquets',
    price: 1499,
    currency: '₹',
    image: '/images/products/rose-bloom-bouquet.jpg',
    alt: 'Handmade rich crimson and blush velvet rose bouquet by Bloomncharms.',
    description: 'A lavish arrangement of textured roses in deep crimson and antique blush tones. Hand-sculpted with exceptional detail and finished with satin ribbon.',
    stock: 4,
    available: true,
    isCustomizable: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    slug: 'tulip-bouquet',
    name: 'Tulip Bouquet',
    subtitle: 'Modern simplicity posy',
    category: 'bouquets',
    price: 899,
    currency: '₹',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTfLmX5Iph74QZuIMVgnbGK9aj1RicB-SvHgDa8DYk4VCGMvbRQ4z37A6xPwRVs8O6wgECG3pUOgNjgHvjFLInt5PFeSl0eKJNf4dBM25rGWTRk6E445MeTHK8y18Mtsrn7lAHy1PAgseIIO1kR7Wqpe0XkKlzBk9HxdZMEEfdART3f81kC-F4P4Tzf9y0ff1IrtMEhonA_0Woj06xqxHm5uBVhw9i_3osBF5nMW0nvoTzq9HrKCTZ8Q',
    alt: 'Minimalist bouquet of sculpted satin tulips in ivory and peach.',
    description: 'Sculptural elegance featuring clean botanical lines and soft pastel stems. Perfect for gifting and personal workspace accents.',
    stock: 9,
    available: true,
    isCustomizable: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    slug: 'signature-bouquet',
    name: 'Signature Bouquet',
    subtitle: 'Handcrafted slow-made bouquet',
    category: 'bouquets',
    price: 1199,
    currency: '₹',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF9LhK-DWgkD9o8NazAGe8Q6PaRGefjofA0MkhbbdF-K2os5R11RLbDk_miN0OFMMTEW17weEAuecp-U9fTIIfvMDw9Z3HJpGCvhaLT0dkqMjuZ3KFQUUepvscUCi1kATvfsErjVLezdcecmI1u_eVw9vAH5PcT3uJB8psszJEcE_ZlKO1DByuqhlkPkX4UNJj_VgSzEXxYXI5Ex3hsANVQocWWPJJ1wuEOidiZqogSYc6hB9FcKxE2g',
    alt: 'Signature bouquet of handcrafted chenille stems wrapped in kraft paper.',
    description: 'A classic collection of hand-formed blossoms crafted with care in our atelier.',
    stock: 6,
    available: true,
    isCustomizable: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    slug: 'handmade-tulip',
    name: 'Handmade Tulip',
    subtitle: 'Single sculpted stem',
    category: 'flowers',
    price: 199,
    currency: '₹',
    image: '/images/products/handmade-tulip.jpg',
    alt: 'Handcrafted single-stem tulip in soft ivory and peach by Bloomncharms.',
    description: 'A single sculpted tulip stem with curved satin petals and a slender stem. Perfect on its own in a slender ceramic bud vase or gathered in pairs.',
    stock: 18,
    available: true,
    badge: 'Single Stem',
    tag: 'Single Stem',
    isCustomizable: false,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000007',
    slug: 'blue-daisy-bloom',
    name: 'Blue Daisy Bloom',
    subtitle: 'Single botanical blossom',
    category: 'flowers',
    price: 229,
    currency: '₹',
    image: '/images/products/blue-daisy-bloom.jpg',
    alt: 'Handmade sky blue daisy blossom with golden center by Bloomncharms.',
    description: 'Bright and cheerful sky-blue petals radiating around a soft textured yellow core. Each petal is individually shaped for a natural, organic bloom.',
    stock: 15,
    available: true,
    isCustomizable: false,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    slug: 'lavender-bloom-keyring',
    name: 'Lavender Bloom Keyring',
    subtitle: 'Handmade floral charm with brass ring',
    category: 'keyrings',
    price: 299,
    currency: '₹',
    image: '/images/products/lavender-bloom-keyring.jpg',
    alt: 'Lavender Bloom Keyring with tiny detailed handmade flowers and brass clasp by Bloomncharms.',
    description: 'Carry a piece of the garden with you. Features miniature lavender sprigs and blush buds secured to a sturdy brushed gold-tone keyring.',
    stock: 10,
    available: true,
    badge: 'Bestseller',
    tag: 'Bestseller',
    isCustomizable: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000009',
    slug: 'mini-tulip-keyring',
    name: 'Mini Tulip Keyring',
    subtitle: 'Blush pink bell charm',
    category: 'keyrings',
    price: 279,
    currency: '₹',
    image: '/images/products/mini-tulip-keyring.jpg',
    alt: 'Mini Tulip Keyring in blush pink resting on linen by Bloomncharms.',
    description: 'A charming miniature tulip bud finished with a discreet leaf and premium clasp. Lightweight, durable, and delightful for daily keys or bag accents.',
    stock: 7,
    available: true,
    isCustomizable: false,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000010',
    slug: 'daisy-keyring',
    name: 'Daisy Keyring',
    subtitle: 'White & sunny yellow charm',
    category: 'keyrings',
    price: 249,
    currency: '₹',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxz0R29j_PtTkOkVH-qV_rP_RV-5um4zVJLPHAS37jCuJ8T7VRBKCRGk6sbxD298s6Q2m0qFEShW32jBfqOlkV5GtKnyDwqu85m6YUQhehvrPlW1F_FSHZG9fBMbYoec1Kk_jEFUyhISGaTTbnMrVnrgGNH5-YEzS3_28MQsXQGo36cMNAX0uP_BFvmv8WXykWXOvBKj81GAbkEpd9oy3Mxj3xWu9fXihcHGrFt74nTssNvLK0if2GTg',
    alt: 'Handcrafted floral daisy keyring hanging from bag loop.',
    description: 'Bright and cheerful daisy flower charm with gold-plated clip.',
    stock: 12,
    available: true,
    isCustomizable: false,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000011',
    slug: 'rose-bloom-keyring',
    name: 'Rose Bloom Keyring',
    subtitle: 'Deep crimson velvet blossom',
    category: 'keyrings',
    price: 299,
    currency: '₹',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgNP5-4nauFjMjTobPqe0-ouHPjpXDkPVWedkPR-Ww6YdCLq9QojoaKFJDflSOEBeHjxMwAKbLh5cOVIERrEy1CIJRODNBOqYWjWvktM0wcv9L8lLE4zS8OOTUP0sPaTgZZALlJZ6CkaDxrjNGTuPleMIZ_6stbLazT7Znq3DlGP27jhjkcdmnk7GaLZ2r9UB74cr-EywBqeuQQF66Rtl0zipr7K98rxfuSbxu1oUzcJFt1fPHRjDUDQ',
    alt: 'Single stem rose keyring in deep muted red on stone surface.',
    description: 'Sculpted mini rose with brushed brass clasp.',
    stock: 8,
    available: true,
    isCustomizable: false,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000012',
    slug: 'sunflower-keyring',
    name: 'Sunflower Keyring',
    subtitle: 'Golden sunshine blossom',
    category: 'keyrings',
    price: 279,
    currency: '₹',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoXI2VDg9ZxSUCdPEssVZYiojmRQOj7zh3YaowT2JtSJ3RBaK8XCdiZmW_wfyL4_6k5WT8Fc670u7u550cG_fuPVcIAgMBwZuH-3ktWAl8ZcUbOKWCYjg4wmXczzLJ3HILYMkdBymJPQ5_ajwVQbNiH6Z7gnZQK-ADBEFbrLR1rWZp5Rx0AiRy6D-fZCbpvKoTnIWTzRL2i3WJuIO7nptd3p2u_xmU7yOPZA8Jqxd4DcBClZwJCgqrmw',
    alt: 'Sunflower keyring with golden petals and brown center.',
    description: 'Radiant handcrafted miniature sunflower with secure keyring.',
    stock: 14,
    available: true,
    isCustomizable: false,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000013',
    slug: 'butterfly-bloom-charm',
    name: 'Butterfly Bloom Charm',
    subtitle: 'Delicate clip-on keepsake',
    category: 'charms',
    price: 199,
    currency: '₹',
    image: '/images/products/butterfly-bloom-charm.jpg',
    alt: 'Handmade butterfly bloom charm with lilac petals by Bloomncharms.',
    description: 'A whimsical handmade charm with soft lilac wings and tiny flower accents. Designed to clip seamlessly onto bags, zippers, or key loops.',
    stock: 14,
    available: true,
    isCustomizable: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000014',
    slug: 'daisy-bag-charm',
    name: 'Daisy Bag Charm',
    subtitle: 'Handcrafted floral accent',
    category: 'charms',
    price: 229,
    currency: '₹',
    image: '/images/products/daisy-bag-charm.jpg',
    alt: 'Handcrafted white and sunny yellow daisy bag charm by Bloomncharms.',
    description: 'An elegant white daisy with a sunny yellow center and durable lobster clasp. Adds an instant touch of bespoke handmade craft to your tote or backpack.',
    stock: 11,
    available: true,
    isCustomizable: false,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000015',
    slug: 'pastel-flower-charm-set',
    name: 'Pastel Flower Charm Set',
    subtitle: 'Trio of clip-on charms',
    category: 'charms',
    price: 349,
    currency: '₹',
    image: '/images/products/pastel-flower-charm-set.jpg',
    alt: 'Trio of pastel flower charms with metal clasps by Bloomncharms.',
    description: 'A curated trio of miniature blossom charms in terracotta, blush, and cream. Mix and match across bags, journals, or key sets.',
    stock: 9,
    available: true,
    isCustomizable: false,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000016',
    slug: 'mini-bloom-gift-set',
    name: 'Mini Bloom Gift Set',
    subtitle: 'Curated bouquet & keyring box',
    category: 'gift-sets',
    price: 799,
    currency: '₹',
    image: '/images/products/mini-bloom-gift-set.jpg',
    alt: 'Curated Mini Bloom Gift Set with bouquet, keyring, and gift box by Bloomncharms.',
    description: 'The complete little gift: contains a handcrafted mini posy, matching keyring, and a handwritten botanical note card nestled in an eco-friendly gift box.',
    stock: 6,
    available: true,
    badge: 'Gift Box',
    tag: 'Gift Box',
    isCustomizable: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000017',
    slug: 'best-friend-gift-box',
    name: 'Best Friend Gift Box',
    subtitle: 'Bespoke matching duo set',
    category: 'gift-sets',
    price: 999,
    currency: '₹',
    image: '/images/products/best-friend-gift-box.jpg',
    alt: 'Best Friend Gift Box with twin floral keyrings and bouquet by Bloomncharms.',
    description: 'Created to celebrate special bonds. Includes two complementary floral keyrings, a vibrant flower arrangement, and customizable ribbon packaging.',
    stock: 5,
    available: true,
    badge: 'Curated',
    tag: 'Curated',
    isCustomizable: true,
  },
];

export interface ProductQueryFilters {
  category?: string;
  featured?: boolean;
  customizable?: boolean;
  search?: string;
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest';
}

export class ProductService {
  /**
   * Fetches all active products, optionally filtering by category, search, or attributes.
   */
  static async getProducts(filters: ProductQueryFilters = {}): Promise<{ products: ProductDTO[]; total: number }> {
    const hasSupabase = Boolean(config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY));

    if (hasSupabase) {
      try {
        const client = config.SUPABASE_SERVICE_ROLE_KEY ? getAdminSupabaseClient() : getAnonSupabaseClient();
        let query = client
          .from('products')
          .select(`
            id,
            slug,
            name,
            subtitle,
            description,
            price,
            currency,
            image_url,
            alt_text,
            badge,
            tag,
            is_customizable,
            is_featured,
            is_bestseller,
            is_active,
            processing_days,
            categories (
              id,
              name,
              slug
            ),
            inventory (
              stock_quantity
            )
          `)
          .eq('is_active', true);

        if (filters.featured) {
          query = query.eq('is_featured', true);
        }

        if (filters.customizable) {
          query = query.eq('is_customizable', true);
        }

        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          let mapped: ProductDTO[] = data.map((item: any) => {
            const categorySlug = item.categories?.slug || 'bouquets';
            const stockQty = item.inventory?.stock_quantity ?? 0;
            return {
              id: item.id,
              slug: item.slug,
              name: item.name,
              subtitle: item.subtitle || undefined,
              category: categorySlug,
              price: Number(item.price),
              currency: item.currency === 'INR' ? '₹' : item.currency,
              image: item.image_url || '/images/products/signature-bloom-bouquet.jpg',
              alt: item.alt_text || item.name,
              description: item.description,
              stock: stockQty,
              available: stockQty > 0,
              badge: item.badge || undefined,
              tag: item.tag || undefined,
              isCustomizable: item.is_customizable,
              isFeatured: item.is_featured,
              processingDays: item.processing_days || undefined,
            };
          });

          if (filters.category && filters.category !== 'all') {
            mapped = mapped.filter((p) => p.category === filters.category);
          }

          if (filters.sort) {
            mapped = this.sortProducts(mapped, filters.sort);
          }

          return { products: mapped, total: mapped.length };
        }
      } catch (err) {
        console.warn('[ProductService] Supabase query failed, using seeded catalog fallback:', err);
      }
    }

    // Fallback seed catalog
    let list = [...SEED_PRODUCTS];

    if (filters.category && filters.category !== 'all') {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters.featured) {
      list = list.filter((p) => p.isFeatured);
    }
    if (filters.customizable) {
      list = list.filter((p) => p.isCustomizable);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (filters.sort) {
      list = this.sortProducts(list, filters.sort);
    }

    return { products: list, total: list.length };
  }

  /**
   * Fetches a single active product by slug.
   */
  static async getProductBySlug(slug: string): Promise<ProductDTO | null> {
    const hasSupabase = Boolean(config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY));

    if (hasSupabase) {
      try {
        const client = config.SUPABASE_SERVICE_ROLE_KEY ? getAdminSupabaseClient() : getAnonSupabaseClient();
        const { data, error } = await client
          .from('products')
          .select(`
            id,
            slug,
            name,
            subtitle,
            description,
            price,
            currency,
            image_url,
            alt_text,
            badge,
            tag,
            is_customizable,
            is_featured,
            is_bestseller,
            is_active,
            processing_days,
            categories (
              id,
              name,
              slug
            ),
            inventory (
              stock_quantity
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          const categorySlug = (data as any).categories?.slug || 'bouquets';
          const stockQty = (data as any).inventory?.stock_quantity ?? 0;
          return {
            id: data.id,
            slug: data.slug,
            name: data.name,
            subtitle: data.subtitle || undefined,
            category: categorySlug,
            price: Number(data.price),
            currency: data.currency === 'INR' ? '₹' : data.currency,
            image: data.image_url || '/images/products/signature-bloom-bouquet.jpg',
            alt: data.alt_text || data.name,
            description: data.description,
            stock: stockQty,
            available: stockQty > 0,
            badge: data.badge || undefined,
            tag: data.tag || undefined,
            isCustomizable: data.is_customizable,
            isFeatured: data.is_featured,
            processingDays: data.processing_days || undefined,
          };
        }
      } catch (err) {
        console.warn(`[ProductService] Supabase getProductBySlug('${slug}') failed, using seed fallback:`, err);
      }
    }

    const found = SEED_PRODUCTS.find((p) => p.slug === slug);
    return found || null;
  }

  /**
   * Fetches active product categories with counts.
   */
  static async getCategories(): Promise<CategoryDTO[]> {
    const hasSupabase = Boolean(config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY));

    if (hasSupabase) {
      try {
        const client = config.SUPABASE_SERVICE_ROLE_KEY ? getAdminSupabaseClient() : getAnonSupabaseClient();
        const { data, error } = await client
          .from('categories')
          .select('id, name, slug, description, image_url')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const { products } = await this.getProducts();
          return data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || undefined,
            imageUrl: c.image_url || undefined,
            productCount: products.filter((p) => p.category === c.slug).length,
          }));
        }
      } catch (err) {
        console.warn('[ProductService] Supabase getCategories failed, using seed fallback:', err);
      }
    }

    return SEED_CATEGORIES.map((c) => ({
      ...c,
      productCount: SEED_PRODUCTS.filter((p) => p.category === c.slug).length,
    }));
  }

  private static sortProducts(products: ProductDTO[], sort: string): ProductDTO[] {
    return [...products].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'featured') return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      return 0;
    });
  }
}