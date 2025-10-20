import { NextRequest } from 'next/server'
import { getUserFromToken } from './auth'

export async function authenticateRequest(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    return user
}
