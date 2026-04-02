import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import Brand from '@/models/Brand';
import { getSiteSettings } from '@/lib/site-config';

function buildPrompt(text: string, categoryList: { id: string; name: string; parentName?: string }[], brandList: { id: string; name: string }[], storeName: string, siteDomain: string, storeAddress: string) {
    return `
Bạn là CHUYÊN GIA sản phẩm công nghệ kình nghiệm (laptop, chuột, bàn phím, tai nghe, loa, phụ kiện...)
và đồng thời là CHUYÊN GIA SEO viết content bán hàng tại Việt Nam.

INPUT TEXT (mô tả sản phẩm từ người bán):
"""
${text}
"""

DANH MỤC CÓ SẴN (ưu tiên chọn danh mục CON cụ thể nhất, KHÔNG chọn danh mục CHA nếu có con phù hợp):
${categoryList.map(c => `- ${c.name}${c.parentName ? ` (thuộc ${c.parentName})` : ' (danh mục chính)'}`).join('\n')}

THƯƠNG HIỆU CÓ SẴN: ${brandList.map(b => b.name).join(', ')}

NHIỆM VỤ QUAN TRỌNG:
1. Nhận diện tên sản phẩm từ text.
2. Dùng KIẾN THỨC NỘI TẠI của bạn về sản phẩm đó để bổ sung thông số kỹ thuật chính xác và viết mô tả SEO chuyên nghiệp.
3. Phân tích tình trạng, giá cả từ text của người bán.

Trả về JSON theo schema sau (CHỈ JSON, không text khác):
{
  "name": "Tên sản phẩm sạch (không chứa mô tả quảng cáo, tình trạng máy)",
  "brand": "Tên thương hiệu khớp chính xác từ danh sách hoặc null",
  "categoryName": "Tên danh mục CON cụ thể nhất từ danh sách (VD: 'Gaming Laptop' thay vì 'Laptop', 'Chuột Gaming' thay vì 'Chuột'). Chỉ chọn danh mục CHA khi không có con nào phù hợp.",
  "basePrice": số nguyên là giá bán chính thức (BẮT BUỘC — khi chỉ có 1 giá duy nhất trong text, đây chính là basePrice),
  "salePrice": null — LUÔN ĐỂ NULL,
  "stock": 1,
  "isUsed": true nếu text thể hiện máy cũ/qua sử dụng/thanh lý/chạm nhẹ, false nếu mới 100% seal,
  "condition": một trong: "new" (mới 99-100%), "like_new" (như mới 95-99%), "used" (đã dùng rõ ràng), "refurbished" (tân trang),
  "usedGrade": CHỈ được là "A" hoặc "B":
    - "A" = còn mới 97-99%
    - "B" = còn 90-96%, có vết dùng nhẹ
    - Nếu isUsed=false để null,
  "conditionNote": phân tích chi tiết tình trạng từ text, null nếu không có,
  "warrantyMonths": số tháng BH (đọc từ text, nếu không có → 3),
  "gift": quà tặng kèm nếu có hoặc null,
  "description": PHẢI viết bài HTML SEO chuyên nghiệp dài 300-500 từ, chuỗi HTML hợp lệ, không xuống dòng \n trong JSON. Cấu trúc BẮT BUỘC:
    - <img src="{{IMAGE_0}}" alt="[tên sản phẩm]" style="max-width:100%;border-radius:8px;margin-bottom:16px">
    - <h2>[Tên đầy đủ] — [Tình trạng/Loại] | Giá tốt tại ${storeName} ${storeAddress}</h2>
    - <p>Đoạn mở đầu 2-3 câu: HOOK mạnh — nêu lý do người dùng NÊN MUA máy này (hiệu năng/giá trị/phù hợp ai). VIẾT NHƯ COPYWRITER chuyên nghiệp.</p>
    - <h3>Thông số kỹ thuật chính</h3>
    - <ul>Liệt kê CÁC THÔNG SỐ THỰC TẾ từ kiến thức của bạn (CPU, GPU, RAM, SSD, màn hình, pin... đầy đủ không thiếu)</ul>
    - <h3>Đây là lựa chọn hoàn hảo cho ai?</h3>
    - <p>Mô tả target user: sinh viên/dân văn phòng/designer/gamer... và lý do tại sao sản phẩm này phù hợp với họ. 3-4 câu cụ thể, thuyết phục.</p>
    - <h3>Ngoại hình & Thiết kế</h3>
    - <p>Mô tả ngoại hình thực tế của sản phẩm: màu sắc, chất liệu, trọng lượng, cảm giác cầm/dùng. Dùng từ ngữ hấp dẫn.</p>
    - <h3>Tình trạng máy</h3>
    - <p>Phân tích trung thực từ text của người bán: độ mới, điều gì còn tốt, điều gì cần lưu ý.</p>
    - <h3>Chính sách ${storeName} ${storeAddress}</h3>
    - <p>Bảo hành [X] tháng tại shop. Đổi trả trong 7 ngày nếu lỗi phần cứng. Hỗ trợ kỹ thuật trọn đời.</p>
    - <h3>Mua sắm tại hệ sinh thái ${storeName}</h3>
    - <p>Xem thêm sản phẩm tại <a href="${siteDomain}/">${storeName} Store</a> — hệ sinh thái gear uy tín hàng đầu ${storeAddress}.</p>,
  "tags": ["tag1", "tag2"],
  "specs": {
    "key": "value"
  },
  "variants": []
}

QUY TẮC Ư U TIÊN THÔNG SỐ (CRIỚCAL — BẮT BUỘC TUÂN THỦ):
- THÔNG SỐ TỪ INPUT TEXT luôn ĐƯỢC Ư U TIÊN HƠN KIẾN THỨC NỘI TẠI của bạn.
- Nếu người bán ghi "RAM 8GB" thì điền 8GB, DÙ model gốc có 16GB.
- Nếu người bán ghi "SSD 256GB" thì điền 256GB, DÙ model gốc có 512GB.
- Nếu người bán ghi "i5-1135G7" thì điền i5-1135G7, DÙ model gốc có i7-1165G7.
- Chỉ dùng kiến thức nội tại để BỔ SUNG các thông số KHÔNG được nhắc tới trong text.
- Reason: máy cũ thường đã được nâng/hạ RAM, đổi SSD, thay linh kiện khắc so với cấu hình gốc của hãng.

QUY TẮC CHO specs:
- Dùng thông số TỪ INPUT TEXT trước, dùng kiến thức nội tại để bổ sung những gì còn thiếu.
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

QUY TẮC GIÁ (VÔ CÙNG QUAN TRỌNG — người Việt viết giá bằng nhiều tiếng lóng, bạn PHẢI dịch chính xác sang VNĐ):
- Triệu ("tr", "triệu", "trịu", "củ", "m", "M"): nhân với 1.000.000
   + "1tr", "1 triệu", "1 trịu", "1 củ", "1m" → 1000000
   + "17.5tr", "17,5tr", "17tr5", "17 củ rưỡi" → 17500000
   + "10triu800", "10trieu800", "10tr800" → 10800000
   + "2tr490" → 2490000 (hai triệu bốn trăm chín mươi nghìn)
   + "1tr5" → 1500000
- Ngàn/Nghìn ("k", "K", "cành"): nhân với 1.000
   + "1000k" → 1000000
   + "14.800K", "14.800k", "14800k" → 14800000 (Lấy số 14800 x 1000)
   + "11.900K", "11.900k", "11900k" → 11900000 (Lấy số 11900 x 1000)
   + "890k", "890K" → 890000
- Có chữ "Giá" trực tiếp: 
   + "giá 20 triệu", "giá 20tr" → 20000000
- Tiền ghi đầy đủ các số 0:
   + "1.290.000đ", "1,290,000", "1290000" → 1290000
- Số cụt ngũn (ngữ cảnh nghìn): 
   + "giá 500" ngầm định là 500 nghìn → 500000
- Nếu không tìm thấy giá → trả về null.

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
        const [categories, brands, siteSettings] = await Promise.all([
            Category.find({ isActive: true }, 'name _id parent').populate('parent', 'name'),
            Brand.find({}, 'name _id'),
            getSiteSettings(),
        ]);

        const categoryList = categories.map(c => ({
            id: c._id.toString(),
            name: c.name,
            parentName: (c.parent as any)?.name || undefined,
        }));
        const brandList = brands.map(b => ({ id: b._id.toString(), name: b.name }));
        const prompt = buildPrompt(text, categoryList, brandList, siteSettings.storeName, siteSettings.siteDomain, siteSettings.storeAddress);

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

        // Map category/brand name → ID (prefer exact match, then sub-category over parent)
        if (parsedData.categoryName) {
            const catName = parsedData.categoryName.toLowerCase();
            // 1. Exact match
            let match = categoryList.find(c => c.name.toLowerCase() === catName);
            // 2. Partial match — prefer sub-categories (those with parentName)
            if (!match) {
                const partials = categoryList.filter(c => c.name.toLowerCase().includes(catName) || catName.includes(c.name.toLowerCase()));
                match = partials.find(c => c.parentName) || partials[0];
            }
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
