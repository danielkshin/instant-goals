export interface TeamData {
    id: number;
    name: string;
    longName: string;
    score?: number;
}

export interface MatchData {
    id: number;
    home: TeamData;
    away: TeamData;
    status: {
        utcTime: string;
        started: boolean;
        finished: boolean;
    };
}

export interface LinkData {
    title: string;
    url: string;
    permalink: string;
    created: number;
}

export interface LeagueData {
    primaryId: number;
    name: string;
    matches: MatchData[];
}