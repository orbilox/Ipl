const CRICKET_API_KEY = process.env.CRICKET_API_KEY || ''
const CRICKET_API_BASE = process.env.CRICKET_API_BASE || 'https://api.cricapi.com/v1'

export interface LiveMatchData {
  id: string
  name: string
  status: string
  score: Array<{
    r: number
    w: number
    o: number
    inning: string
  }>
  teams: string[]
  teamInfo: Array<{ name: string; shortname: string; img: string }>
  dateTimeGMT: string
  matchType: string
}

export async function fetchLiveMatches(): Promise<LiveMatchData[]> {
  try {
    const res = await fetch(
      `${CRICKET_API_BASE}/currentMatches?apikey=${CRICKET_API_KEY}&offset=0`,
      { next: { revalidate: 30 } }
    )
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return data.data?.filter((m: any) => m.matchType === 't20') || []
  } catch {
    return getMockLiveData()
  }
}

export async function fetchMatchScore(matchId: string): Promise<any> {
  try {
    const res = await fetch(
      `${CRICKET_API_BASE}/match_scorecard?apikey=${CRICKET_API_KEY}&id=${matchId}`,
      { next: { revalidate: 15 } }
    )
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return data.data
  } catch {
    return null
  }
}

function getMockLiveData(): LiveMatchData[] {
  return [
    {
      id: 'mock_1',
      name: 'Royal Challengers Bangalore vs Kolkata Knight Riders',
      status: 'KKR need 143 runs in 82 balls',
      score: [
        { r: 187, w: 5, o: 20, inning: 'Royal Challengers Bangalore Inning 1' },
        { r: 45, w: 2, o: 6.2, inning: 'Kolkata Knight Riders Inning 1' },
      ],
      teams: ['Royal Challengers Bangalore', 'Kolkata Knight Riders'],
      teamInfo: [
        { name: 'Royal Challengers Bangalore', shortname: 'RCB', img: '' },
        { name: 'Kolkata Knight Riders', shortname: 'KKR', img: '' },
      ],
      dateTimeGMT: new Date().toISOString(),
      matchType: 't20',
    }
  ]
}
