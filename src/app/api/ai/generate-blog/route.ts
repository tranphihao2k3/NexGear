import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

function buildPrompt(keyword: string, tone: string) {
    return `Bạn là một chuyên gia viết blog SEO về công nghệ, laptop, gaming gear tại Việt Nam.
Hãy viết một bài blog hoàn chỉnh bằng tiếng Việt với từ khóa: "${keyword}"

Giọng văn: ${tone}
Yêu cầu:
- Tiêu đề hấp dẫn, chứa từ khóa chính
- Mô tả ngắn (excerpt) 2-3 câu tóm tắt
- Nội dung chi tiết 800-1500 từ, chia thành các heading H2, H3
- Có danh sách bullet points khi cần
- SEO-friendly: từ khóa xuất hiện tự nhiên trong bài
- Kết bài có call-to-action
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
- Trường "content" phải là HTML hợp lệ với các tag h2, h3, p, ul, li, strong, em
- Trường "imagePrompt" phải bằng tiếng Anh, mô tả chi tiết ảnh đại diện phù hợp với bài viết
- Chỉ trả về JSON, không có text nào khác`;
}

function getGeminiKeys(): string[] {
    const keys: string[] = [];
    if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2);
    return keys;
}

/** Try Gemini models first, with multiple keys */
async function tryGemini(prompt: string): Promise<string | null> {
    const keys = getGeminiKeys();
    if (keys.length === 0) return null;

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

    for (const key of keys) {
        const client = new GoogleGenAI({ apiKey: key });
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
                console.warn(`[ai-blog] key=${key.slice(-6)} ${model} failed:`, err.message);
                continue;
            }
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
            continue;
        }
    }
    return null;
}

export async function POST(request: Request) {
    try {
        const { keyword, tone = 'chuyên nghiệp' } = await request.json();

        if (!keyword || keyword.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập từ khóa' },
                { status: 400 }
            );
        }

        const hasGemini = !!process.env.GEMINI_API_KEY;
        const hasOpenAI = !!process.env.OPENAI_API_KEY;
        if (!hasGemini && !hasOpenAI) {
            return NextResponse.json(
                { success: false, error: 'Chưa cấu hình GEMINI_API_KEY hoặc OPENAI_API_KEY trong .env.local' },
                { status: 500 }
            );
        }

        const prompt = buildPrompt(keyword.trim(), tone);

        // Try Gemini first, fallback to OpenAI
        let responseText: string | null = null;
        let usedProvider = '';

        if (hasGemini) {
            try {
                responseText = await tryGemini(prompt);
                if (responseText) usedProvider = 'gemini';
            } catch (err: any) {
                console.warn('[ai-blog] Gemini error, trying OpenAI fallback:', err.message);
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

        let parsedData: any;
        try {
            const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedData = JSON.parse(cleaned);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Không thể phân tích kết quả từ AI' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: parsedData, provider: usedProvider });

    } catch (error: any) {
        console.error('[ai-generate-blog]', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi AI' },
            { status: 500 }
        );
    }
}
