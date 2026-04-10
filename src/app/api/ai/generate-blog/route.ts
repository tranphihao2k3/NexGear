import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dbConnect from '@/lib/mongodb';
import { Product, Category } from '@/models';
import { getSiteSettings } from '@/lib/site-config';

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(keyword: string, tone: string, contextStr: string, storeName: string) {
    return `Bạn là một chuyên gia viết blog SEO về công nghệ, laptop, gaming gear tại Việt Nam cho cửa hàng thực tế tên là ${storeName}.
Hãy viết một bài blog hoàn chỉnh bằng tiếng Việt với từ khóa: "${keyword}"

${contextStr}

Giọng văn: ${tone}
Yêu cầu:
- Tiêu đề hấp dẫn, chứa từ khóa chính
- Mô tả ngắn (excerpt) 2-3 câu tóm tắt
- Nội dung chi tiết 800-1500 từ, chia thành các heading H2, H3
- Cố gắng LỒNG GHÉP TỰ NHIÊN các sản phẩm có thật của ${storeName} (được cung cấp trong THÔNG TIN CỬA HÀNG ở trên) vào bài viết, kèm theo thông tin nổi bật và mức giá của sản phẩm đó.
- Khi nhắc đến sản phẩm của cửa hàng, hãy sử dụng đường link thực tế lấy từ (Link tham khảo) trong phần thông tin cửa hàng cung cấp với thẻ <a>. Ví dụ: <a href="/product/abc-slug">Tên sản phẩm</a>.
- Có danh sách bullet points khi cần
- SEO-friendly: từ khóa xuất hiện tự nhiên trong bài
- Kết bài có gọi hành động (Call-to-action) rõ ràng, mời khách hàng xem thêm sản phẩm hoặc dùng dịch vụ của ${storeName}.
- Tags phù hợp (3-5 tags, phân cách bằng dấu phẩy)
- Meta title (tối đa 60 ký tự)
- Meta description (tối đa 155 ký tự)

Trả về JSON theo schema sau (CHỈ JSON, không text khác):
{
  "title": "Tiêu đề bài viết",
  "excerpt": "Mô tả ngắn...",
  "content": "<h2>...</h2><p>...</p>...",
  "tags": "tag1, tag2, tag3",
  "metaTitle": "Meta title SEO",
  "metaDescription": "Meta description SEO",
  "imagePrompt": "English prompt to generate a featured image for this blog post, descriptive and specific"
}

QUAN TRỌNG:
- Trường "content" phải là HTML hợp lệ với các tag h2, h3, p, a, ul, li, strong, em
- Cần khéo léo chèn link các sản phẩm có ở ${storeName} dưới dạng thẻ <a>.
- Trường "imagePrompt" phải bằng tiếng Anh, mô tả chi tiết ảnh đại diện phù hợp với bài viết
- Chỉ trả về JSON, không có text nào khác`;
}

// ─── AI providers ─────────────────────────────────────────────────────────────

function getGeminiKeys(): string[] {
    const keys: string[] = [];
    if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
    for (let i = 2; i <= 10; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key) keys.push(key);
    }
    return keys;
}

let geminiKeyIndex = 0;

async function tryGemini(prompt: string): Promise<string | null> {
    const keys = getGeminiKeys();
    if (keys.length === 0) return null;

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

    const startIdx = geminiKeyIndex;
    geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;

    for (let k = 0; k < keys.length; k++) {
        const keyIdx = (startIdx + k) % keys.length;
        const apiKey = keys[keyIdx];
        const client = new GoogleGenAI({ apiKey });

        for (const model of models) {
            try {
                const response = await client.models.generateContent({
                    model,
                    contents: prompt,
                    config: { responseMimeType: 'application/json', temperature: 0.8 },
                });
                const text = response.text || '';
                if (text) return text;
            } catch (err: any) {
                const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota');
                console.warn(`[ai-blog] Gemini ${model} (key ${keyIdx + 1}/${keys.length}) failed:`, err.message);
                if (isRateLimit) break;
                continue;
            }
        }
    }
    return null;
}

async function tryOpenAI(prompt: string): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const client = new OpenAI({ apiKey });
    const models = ['gpt-4o-mini', 'gpt-4o'];

    for (const model of models) {
        try {
            const response = await client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: 'Bạn là AI viết blog SEO chuyên nghiệp. Luôn trả về JSON hợp lệ, không text khác.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.8,
                response_format: { type: 'json_object' },
            });
            const text = response.choices[0]?.message?.content || '';
            if (text) return text;
        } catch (err: any) {
            console.warn(`[ai-blog] OpenAI ${model} failed:`, err.message);
        }
    }
    return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

/**
 * Vietnamese noise words to strip BEFORE querying DB.
 * These are geographic names, prepositions, and filler words that
 * will never match product names or tags.
 */
const NOISE_WORDS = new Set([
    'tại', 'ở', 'tại đây', 'mua', 'bán', 'shop', 'cửa hàng', 'giá',
    'rẻ', 'tốt', 'nhất', 'hàng', 'đầu', 'uy tín', 'chính hãng', 'có',
    // Cities / provinces
    'cần thơ', 'hà nội', 'hồ chí minh', 'hcm', 'đà nẵng', 'hải phòng',
    'bình dương', 'đồng nai', 'an giang', 'kiên giang', 'sóc trăng',
    'bạc liêu', 'cà mau', 'vĩnh long', 'tiền giang', 'bến tre',
    'hậu giang', 'trà vinh', 'long an', 'đồng tháp',
]);

/**
 * Strips noise from keyword and returns meaningful product-search tokens.
 * e.g. "laptop gaming cần thơ" → ["laptop", "gaming"]
 */
function extractSearchTerms(keyword: string): string[] {
    let cleaned = keyword.toLowerCase().trim();

    // Remove multi-word noise phrases first
    for (const noise of NOISE_WORDS) {
        if (noise.includes(' ')) {
            cleaned = cleaned.replace(new RegExp(noise, 'gi'), ' ');
        }
    }

    const tokens = cleaned
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 1 && !NOISE_WORDS.has(t));

    return [...new Set(tokens)];
}

/**
 * Multi-pass product search strategy:
 *
 * Pass 1: MongoDB $text search on (name, tags) — sorted by relevance score.
 *         This is the most accurate: "laptop gaming" → finds gaming laptops first.
 *
 * Pass 2: If $text search returns < 3 results, supplement with per-token regex
 *         across name / tags / slug (catches products missing text index).
 *
 * Pass 3: If still empty, search by category name matching tokens.
 *
 * Pass 4: Final fallback — top-selling products from the whole catalog.
 *
 * Results are deduplicated and capped at 6.
 */
async function fetchRelatedProducts(searchTerms: string[]): Promise<any[]> {
    const select = 'name slug basePrice salePrice description category';
    const seen = new Set<string>();
    const results: any[] = [];

    const addProducts = (docs: any[]) => {
        for (const p of docs) {
            const id = String(p._id);
            if (!seen.has(id)) {
                seen.add(id);
                results.push(p);
            }
        }
    };

    // ── Pass 1: MongoDB full-text search (sorted by relevance score) ──────
    if (searchTerms.length > 0) {
        const textQuery = searchTerms.join(' ');
        try {
            const textResults = await Product.find(
                {
                    isActive: true,
                    $text: { $search: textQuery },
                },
                { score: { $meta: 'textScore' } }
            )
                .sort({ score: { $meta: 'textScore' } })
                .limit(8)
                .select(select)
                .lean();

            addProducts(textResults);
            console.log(`[ai-blog] $text "${textQuery}" → ${textResults.length} hits`);
        } catch (err: any) {
            // $text search may fail if index not built yet
            console.warn('[ai-blog] $text search failed:', err.message);
        }
    }

    // ── Pass 2: Per-token regex on name/tags/slug (supplement to ≥ 3) ────
    if (results.length < 3 && searchTerms.length > 0) {
        const orClauses = searchTerms.flatMap(term => {
            const r = new RegExp(term, 'i');
            return [{ name: r }, { tags: r }, { slug: r }];
        });

        const regexResults = await Product.find({ isActive: true, $or: orClauses })
            .sort({ soldCount: -1 })
            .limit(8)
            .select(select)
            .lean();

        addProducts(regexResults);
        console.log(`[ai-blog] regex → ${regexResults.length} hits (total after: ${results.length})`);
    }

    // ── Pass 3: Category name match ────────────────────────────────────────
    if (results.length < 3 && searchTerms.length > 0) {
        const catClauses = searchTerms.map(term => ({ name: new RegExp(term, 'i') }));
        const matchedCats = await Category.find({ $or: catClauses }).select('_id').lean();

        if (matchedCats.length > 0) {
            const catIds = matchedCats.map((c: any) => c._id);
            const catResults = await Product.find({ isActive: true, category: { $in: catIds } })
                .sort({ soldCount: -1 })
                .limit(8)
                .select(select)
                .lean();
            addProducts(catResults);
            console.log(`[ai-blog] category match → ${catResults.length} hits`);
        }
    }

    // ── Pass 4: Final fallback — top sellers ───────────────────────────────
    if (results.length === 0) {
        const topSellers = await Product.find({ isActive: true })
            .sort({ soldCount: -1, viewCount: -1 })
            .limit(6)
            .select(select)
            .lean();
        addProducts(topSellers);
        console.log('[ai-blog] fallback top sellers → ', topSellers.length);
    }

    return results.slice(0, 6);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const { keyword, tone = 'chuyên nghiệp' } = await request.json();

        if (!keyword || keyword.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập từ khóa' },
                { status: 400 }
            );
        }

        const hasGemini = getGeminiKeys().length > 0;
        const hasOpenAI = !!process.env.OPENAI_API_KEY;
        if (!hasGemini && !hasOpenAI) {
            return NextResponse.json(
                { success: false, error: 'Chưa cấu hình GEMINI_API_KEY hoặc OPENAI_API_KEY trong .env.local' },
                { status: 500 }
            );
        }

        await dbConnect();

        // ── 1. Keyword → search terms ─────────────────────────────────────
        const searchTerms = extractSearchTerms(keyword);
        console.log('[ai-blog] keyword:', keyword, '→ searchTerms:', searchTerms);

        // ── 2. Fetch products by relevance ────────────────────────────────
        const relatedProducts = await fetchRelatedProducts(searchTerms);

        // ── 3. Fetch categories for context ──────────────────────────────
        const topCategories = await Category.find({}).limit(12).select('name').lean();

        // ── 4. Build context string ───────────────────────────────────────
        const productLines = relatedProducts.map((p: any) => {
            let priceStr = formatPrice(p.salePrice || p.basePrice);
            if (p.salePrice && p.basePrice && p.salePrice < p.basePrice) {
                priceStr += ` (Giá gốc: ${formatPrice(p.basePrice)})`;
            }
            const desc = p.description
                ? p.description.substring(0, 120).replace(/<[^>]+>/g, '') + '...'
                : '';
            return `- Tên sản phẩm: ${p.name}
  - Link tham khảo: /product/${p.slug}
  - Mức giá: ${priceStr}
  - Mô tả ngắn: ${desc}`;
        }).join('\n');

        const siteSettings = await getSiteSettings();
        const contextStr = `THÔNG TIN CỬA HÀNG ${siteSettings.storeName} (DÙNG LÀM NGỮ CẢNH):
- Từ khóa SEO người dùng nhập: "${keyword}"
- Từ khóa sản phẩm đã trích xuất: ${searchTerms.join(', ') || '(tổng hợp)'}
- Các danh mục nổi bật của shop: ${topCategories.map((c: any) => c.name).join(', ')}
- Sản phẩm liên quan nhất (dữ liệu thật, PHẢI lồng ghép tự nhiên vào bài):
${productLines}`;

        // ── 5. Call AI ────────────────────────────────────────────────────
        const prompt = buildPrompt(keyword.trim(), tone, contextStr, siteSettings.storeName);
        let responseText: string | null = null;
        let usedProvider = '';

        if (hasGemini) {
            try {
                responseText = await tryGemini(prompt);
                if (responseText) usedProvider = 'gemini';
            } catch (err: any) {
                console.warn('[ai-blog] Gemini error:', err.message);
            }
        }

        if (!responseText && hasOpenAI) {
            try {
                responseText = await tryOpenAI(prompt);
                if (responseText) usedProvider = 'openai';
            } catch (err: any) {
                console.error('[ai-blog] OpenAI error:', err.message);
            }
        }

        if (!responseText) {
            return NextResponse.json(
                { success: false, error: 'Tất cả AI provider đều bị lỗi hoặc rate limit. Vui lòng thử lại sau.' },
                { status: 429 }
            );
        }

        // ── 6. Parse response ─────────────────────────────────────────────
        let parsedData: any;
        try {
            const cleaned = responseText
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim();
            parsedData = JSON.parse(cleaned);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Không thể phân tích kết quả từ AI' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: parsedData,
            provider: usedProvider,
            searchTerms,
            productFound: relatedProducts.length,
        });

    } catch (error: any) {
        console.error('[ai-generate-blog]', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi AI' },
            { status: 500 }
        );
    }
}
