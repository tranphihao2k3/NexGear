import { NextRequest } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get('socket_id') || '';
    const channelName = params.get('channel_name') || '';

    // For presence channels, provide anonymous user info
    if (channelName.startsWith('presence-')) {
        const presenceData = {
            user_id: `visitor_${socketId.replace(/\./g, '_')}`,
            user_info: {},
        };
        const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
        return Response.json(authResponse);
    }

    // Regular private channels
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return Response.json(authResponse);
}
