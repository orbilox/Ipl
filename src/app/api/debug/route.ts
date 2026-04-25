/**
 * Debug endpoint — shows exactly what Cricbuzz is returning right now.
 * GET /api/debug
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    cricbuzz: null,
    database: null,
    errors: [],
  }

  // ── 1. Fetch raw Cricbuzz data ─────────────────────────────────────────
  try {
    const res = await fetch('https://www.cricbuzz.com/api/cricket-match/live-matches', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.cricbuzz.com/',
        'Origin': 'https://www.cricbuzz.com',
      },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })

    if (!res.ok) {
      results.errors.push(`Cricbuzz HTTP error: ${res.status}`)
      results.cricbuzz = { status: 'failed', httpStatus: res.status }
    } else {
      const json = await res.json()

      // Flatten matches
      const liveMatches: any[] = []
      for (const type of json.typeMatches || []) {
        for (const series of type.seriesMatches || []) {
          const wrapper = series.seriesAdWrapper || series
          for (const match of wrapper.matches || []) {
            if (match.matchInfo) {
              liveMatches.push({
                matchId: match.matchInfo.matchId,
                description: match.matchInfo.matchDesc,
                series: match.matchInfo.seriesName,
                state: match.matchInfo.state,
                status: match.matchInfo.status,
                team1: match.matchInfo.team1?.teamSName,
                team2: match.matchInfo.team2?.teamSName,
                team1Full: match.matchInfo.team1?.teamName,
                team2Full: match.matchInfo.team2?.teamName,
                score: match.matchScore || null,
              })
            }
          }
        }
      }

      results.cricbuzz = {
        status: 'success',
        totalLiveMatches: liveMatches.length,
        matches: liveMatches,
      }
    }
  } catch (err: any) {
    results.errors.push(`Cricbuzz fetch error: ${err.message}`)
    results.cricbuzz = { status: 'error', message: err.message }
  }

  // ── 2. Show current DB state ───────────────────────────────────────────
  try {
    const dbMatches = await prisma.match.findMany({
      select: {
        id: true,
        team1Short: true,
        team2Short: true,
        status: true,
        currentInnings: true,
        team1Score: true,
        team2Score: true,
        team1Runs: true,
        team1Wickets: true,
        team1Overs: true,
        team2Runs: true,
        team2Wickets: true,
        team2Overs: true,
        lastBall: true,
        team1Odds: true,
        team2Odds: true,
        updatedAt: true,
      },
      orderBy: { matchNumber: 'asc' },
    })
    results.database = { totalMatches: dbMatches.length, matches: dbMatches }
  } catch (err: any) {
    results.errors.push(`DB error: ${err.message}`)
  }

  // ── 3. Check if Cricbuzz matches our DB live matches ───────────────────
  if (results.cricbuzz?.matches && results.database?.matches) {
    const liveDbMatches = results.database.matches.filter((m: any) => m.status === 'live')
    results.matching = liveDbMatches.map((dbM: any) => {
      const found = results.cricbuzz.matches.find((cbM: any) =>
        (cbM.team1 === dbM.team1Short && cbM.team2 === dbM.team2Short) ||
        (cbM.team1 === dbM.team2Short && cbM.team2 === dbM.team1Short)
      )
      return {
        dbMatch: `${dbM.team1Short} vs ${dbM.team2Short}`,
        cricbuzzFound: !!found,
        cricbuzzData: found || null,
      }
    })
  }

  return NextResponse.json(results, { status: 200 })
}
