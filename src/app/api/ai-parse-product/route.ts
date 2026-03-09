import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import Brand from '@/models/Brand';

function buildPrompt(text: string, categoryList: { id: string; name: string }[], brandList: { id: string; name: string }[]) {
    return `
Bạn là chuyên gia phân tích sản phẩm công nghệ (laptop, chuột, bàn phím, tai nghe, loa, phụ kiện gaming...).

INPUT TEXT (mô tả sản phẩm từ người dùng):
"""
${text}
"""

DANH MỤC CÓ SẴN: ${categoryList.map(c => c.name).join(', ')}
THƯƠNG HIỆU CÓ SẴN: ${brandList.map(b => b.name).join(', ')}

NHIỆM VỤ: Trích xuất thông tin sản phẩm từ text trên. Đây có thể là BẤT KỲ loại sản phẩm nào (laptop, chuột, bàn phím cơ, tai nghe, loa, webcam, phụ kiện...).

Trả về JSON theo schema sau (CHỈ JSON, không text khác):
{
  "name": "Tên sản phẩm sạch (không chứa mô tả quảng cáo, tình trạng máy)",
  "brand": "Tên thương hiệu khớp chính xác từ danh sách hoặc null",
  "categoryName": "Tên danh mục khớp nhất từ danh sách hoặc null",
  "basePrice": null hoặc số nguyên (VD: 17500000),
  "salePrice": null hoặc số nguyên nếu có giá khuyến mãi,
  "description": "Mô tả ngắn gọn hấp dẫn bằng tiếng Việt, bao gồm thông tin tình trạng/quảng cáo đã loại khỏi tên",
  "tags": ["tag1", "tag2"],
  "specs": {
    "key": "value"
  },
  "variants": []
}

QUY TẮC CHO specs:
- Với LAPTOP: bao gồm CPU, GPU, RAM, SSD, Màn hình, Pin, Hệ điều hành, Cân nặng...
- Với CHUỘT: bao gồm Sensor, DPI, Cân nặng, Kết nối, Pin, Switch...
- Với BÀN PHÍM: bao gồm Layout, Switch, Kết nối, Keycap, Đèn LED, Pin...
- Với TAI NGHE: bao gồm Driver, Kết nối, Pin, ANC, Microphone...
- Với LOA: bao gồm Công suất, Kết nối, Pin, Driver...
- Với PHỤ KIỆN: thông số phù hợp loại sản phẩm
- Key phải bằng tiếng Việt rõ ràng (VD: "CPU", "RAM", "Sensor", "Kết nối", "Cân nặng")

QUY TẮC CHO variants (nếu text mô tả nhiều phiên bản/màu/cấu hình):
- Mỗi variant: { "name": "Tên biến thể", "price": số hoặc null, "stock": 0, "attributes": [{"key":"Màu","value":"Đen"}] }
- Nếu không có biến thể rõ ràng, trả về mảng rỗng []

QUY TẮC GIÁ (rất quan trọng — người Việt viết giá rất đa dạng):
- "17.5tr" hoặc "17,5tr" hoặc "17tr5" → 17500000
- "10triu800" hoặc "10trieu800" hoặc "10triệu800" → 10800000
- "2tr490" hoặc "2tr490k" → 2490000
- "1tr5" hoặc "1,5tr" hoặc "1triu5" → 1500000
- "1.290.000đ" hoặc "1,290,000" → 1290000
- "11.900K" hoặc "11.900k" hoặc "11900k" → 11900000
- "890k" hoặc "890K" → 890000
- "500" (ngữ cảnh ngàn) → 500000 (chỉ khi rõ ràng là giá tiền)
- "3m" hoặc "3M" (triệu) → 3000000
- "giá 20 triệu" → 20000000
- Nếu không tìm thấy giá → null

QUY TẮC LÀM TRÒN GIÁ:
- Giá < 20 triệu: chữ số hàng nghìn nên kết thúc bằng 8000 hoặc 9000 (VD: 1,298,000 hoặc 1,299,000, 11,899,000). Nếu giá gốc đã rõ ràng thì giữ nguyên, chỉ làm tròn khi giá mơ hồ.
- Giá >= 20 triệu: giữ nguyên giá, không làm tròn.
`;
}

/** Try Gemini models first */
async function tryGemini(prompt: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const client = new GoogleGenAI({ apiKey });
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

    for (const model of models) {
        try {
            const response = await client.models.generateContent({
                model,
                contents: prompt,
                config: { responseMimeType: 'application/json', temperature: 0.1 },
            });
            const text = response.text || '';
            if (text) return text;
        } catch (err: any) {
            console.warn(`[ai-parse] Gemini ${model} failed:`, err.message);
            continue; // try next model, any error
        }
    }
    return null;
}

/** Fallback to OpenAI */
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
                    { role: 'system', content: 'Bạn là AI trích xuất thông tin sản phẩm. Luôn trả về JSON hợp lệ, không text khác.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' },
            });
            const text = response.choices[0]?.message?.content || '';
            if (text) return text;
        } catch (err: any) {
            console.warn(`[ai-parse] OpenAI ${model} failed:`, err.message);
            continue; // try next model
        }
    }
    return null;
}

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text || text.trim() === '') {
            return NextResponse.json(
                { success: false, message: 'Vui lòng nhập mô tả sản phẩm' },
                { status: 400 }
            );
        }

        const hasGemini = !!process.env.GEMINI_API_KEY;
        const hasOpenAI = !!process.env.OPENAI_API_KEY;
        if (!hasGemini && !hasOpenAI) {
            return NextResponse.json(
                { success: false, message: 'Chưa cấu hình GEMINI_API_KEY hoặc OPENAI_API_KEY trong .env.local' },
                { status: 500 }
            );
        }

        await dbConnect();
        const [categories, brands] = await Promise.all([
            Category.find({ isActive: true }, 'name _id'),
            Brand.find({}, 'name _id'),
        ]);

        const categoryList = categories.map(c => ({ id: c._id.toString(), name: c.name }));
        const brandList = brands.map(b => ({ id: b._id.toString(), name: b.name }));
        const prompt = buildPrompt(text, categoryList, brandList);

        // Try Gemini first, fallback to OpenAI
        let responseText: string | null = null;
        let usedProvider = '';

        if (hasGemini) {
            try {
                responseText = await tryGemini(prompt);
                if (responseText) usedProvider = 'gemini';
            } catch (err: any) {
                console.warn('[ai-parse] Gemini error, trying OpenAI fallback:', err.message);
            }
        }

        if (!responseText && hasOpenAI) {
            try {
                responseText = await tryOpenAI(prompt);
                if (responseText) usedProvider = 'openai';
            } catch (err: any) {
                console.error('[ai-parse] OpenAI error:', err.message);
            }
        }

        if (!responseText) {
            return NextResponse.json(
                { success: false, message: 'Tất cả AI provider đều bị lỗi hoặc rate limit. Vui lòng thử lại sau.' },
                { status: 429 }
            );
        }

        let parsedData: any;
        try {
            const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedData = JSON.parse(cleaned);
        } catch {
            return NextResponse.json(
                { success: false, message: 'Không thể phân tích kết quả từ AI' },
                { status: 500 }
            );
        }

        // Map category/brand name → ID
        if (parsedData.categoryName) {
            const match = categoryList.find(c =>
                c.name.toLowerCase() === parsedData.categoryName?.toLowerCase() ||
                c.name.toLowerCase().includes(parsedData.categoryName?.toLowerCase())
            );
            if (match) parsedData.categoryId = match.id;
        }
        if (parsedData.brand) {
            const match = brandList.find(b =>
                b.name.toLowerCase() === parsedData.brand?.toLowerCase() ||
                b.name.toLowerCase().includes(parsedData.brand?.toLowerCase())
            );
            if (match) parsedData.brandId = match.id;
        }

        return NextResponse.json({ success: true, data: parsedData, provider: usedProvider });

    } catch (error: any) {
        console.error('[ai-parse-product]', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Lỗi AI' },
            { status: 500 }
        );
    }
}
