/**
 * Server-Sent Events endpoint — streams live score updates to the browser.
 * Client connects once; server pushes score updates every 8 seconds.
 * Usage: GET /api/live-stream?matchId=<id>
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      // Send initial score immediately
      try {
        const where = matchId ? { id: matchId } : { status: 'live' as const }
        const match = matchId
          ? await prisma.match.findUnique({ where: { id: matchId } })
          : await prisma.match.findFirst({ where: { status: 'live' }, orderBy: { featuredMatch: 'desc' } })

        if (match) send({ type: 'score', match })
      } catch {}

      // Poll every 8 seconds and push updates
      const interval = setInterval(async () => {
        try {
          const match = matchId
            ? await prisma.match.findUnique({ where: { id: matchId } })
            : await prisma.match.findFirst({ where: { status: 'live' }, orderBy: { featuredMatch: 'desc' } })

          if (!match) {
            send({ type: 'no_live_match' })
            return
          }

          send({ type: 'score', match })

          // Also push updated odds for traders
          send({
            type: 'odds',
            matchId: match.id,
            team1Odds: match.team1Odds,
            team2Odds: match.team2Odds,
            lastBall: match.lastBall,
          })

          if (match.status === 'completed') {
            send({ type: 'match_ended', result: match.result, winner: match.winnerTeam })
            clearInterval(interval)
            controller.close()
          }
        } catch {
          clearInterval(interval)
          try { controller.close() } catch {}
        }
      }, 8000)

      // Cleanup when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
