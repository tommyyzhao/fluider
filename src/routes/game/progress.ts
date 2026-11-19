import { LEVELS } from './levels.js';
import type { Progress } from './types.js';

// Storage keys keep their original prefix on purpose: renaming them would erase existing players' saves.
const KEY = 'verdigris-progress-v2';
const empty = (): Progress => ({ version: 2, cleared: {}, finale: false });

function storageOrDefault(storage?: Storage | null): Storage | null {
	// Merely reading localStorage can throw in sandboxed/blocked browser contexts.
	return storage === undefined
		? typeof localStorage === 'undefined'
			? null
			: localStorage
		: storage;
}

function validated(value: unknown): Progress {
	if (
		!value ||
		typeof value !== 'object' ||
		!('version' in value) ||
		value.version !== 2
	)
		return empty();
	const p = value as Partial<Progress>;
	if (!p.cleared || typeof p.cleared !== 'object' || Array.isArray(p.cleared))
		return empty();
	const cleared: Record<string, number> = {};
	for (const level of LEVELS) {
		const n: unknown = p.cleared[level.id];
		if (Number.isInteger(n) && typeof n === 'number' && n >= 1 && n <= 3)
			cleared[level.id] = n;
	}
	return {
		version: 2,
		cleared,
		finale: p.finale === true && LEVELS.every((l) => cleared[l.id] >= 1),
	};
}

export function loadProgress(storage?: Storage | null): Progress {
	try {
		const raw = storageOrDefault(storage)?.getItem(KEY);
		return raw ? validated(JSON.parse(raw)) : empty();
	} catch {
		return empty();
	}
}

export function saveProgress(p: Progress, storage?: Storage | null): void {
	try {
		storageOrDefault(storage)?.setItem(KEY, JSON.stringify(validated(p)));
	} catch {
		// Progress remains playable in memory when browser storage is unavailable.
	}
}

export function recordClear(
	p: Progress,
	levelId: string,
	dewdrops: number
): Progress {
	const next = validated(p);
	if (!LEVELS.some((l) => l.id === levelId) || !Number.isFinite(dewdrops))
		return next;
	next.cleared[levelId] = Math.max(
		next.cleared[levelId] ?? 0,
		Math.max(1, Math.min(3, Math.floor(dewdrops)))
	);
	return next;
}

/** Only a contiguous run of clears unlocks the next room. */
export function unlocked(p: Progress): number {
	const next = validated(p);
	const first = LEVELS.findIndex((l) => !next.cleared[l.id]);
	return first < 0 ? LEVELS.length - 1 : first;
}

export function loadSound(storage?: Storage | null): {
	muted: boolean;
	volume: number;
} {
	try {
		const value = JSON.parse(
			storageOrDefault(storage)?.getItem('verdigris-sound-v2') ?? '{}'
		);
		return {
			muted: value?.muted === true,
			volume:
				typeof value?.volume === 'number' && Number.isFinite(value.volume)
					? Math.max(0, Math.min(1, value.volume))
					: 0.7,
		};
	} catch {
		return { muted: false, volume: 0.7 };
	}
}

export function saveSound(
	muted: boolean,
	volume: number,
	storage?: Storage | null
): void {
	try {
		storageOrDefault(storage)?.setItem(
			'verdigris-sound-v2',
			JSON.stringify({ muted, volume })
		);
	} catch {
		/* Sound preferences remain available in memory. */
	}
}

export type Onboarding = 'pour' | 'stir' | 'wax' | 'puff';
const CUES = 'verdigris-onboarding-v2';

export function loadOnboarding(
	storage?: Storage | null
): Partial<Record<Onboarding, true>> {
	try {
		const raw = JSON.parse(storageOrDefault(storage)?.getItem(CUES) ?? '{}');
		return {
			...(raw?.pour === true ? { pour: true } : {}),
			...(raw?.stir === true ? { stir: true } : {}),
			...(raw?.wax === true ? { wax: true } : {}),
			...(raw?.puff === true ? { puff: true } : {}),
		};
	} catch {
		return {};
	}
}

export function rememberOnboarding(
	cue: Onboarding,
	storage?: Storage | null
): void {
	try {
		storageOrDefault(storage)?.setItem(
			CUES,
			JSON.stringify({ ...loadOnboarding(storage), [cue]: true })
		);
	} catch {
		// Learning still persists for this session when storage is blocked.
	}
}

export interface Score {
	drops: number;
	at: number;
}
const SCORES = 'fluider-scores-v1';
const MAX_SCORES = 10;

/** Local-only high scores: dewdrops over a finished garden, best first, oldest first on ties. */
export function loadScores(storage?: Storage | null): Score[] {
	try {
		const raw = JSON.parse(storageOrDefault(storage)?.getItem(SCORES) ?? '[]');
		if (!Array.isArray(raw)) return [];
		return raw
			.filter(
				(s): s is Score =>
					Number.isInteger(s?.drops) &&
					s.drops >= 0 &&
					s.drops <= LEVELS.length * 3 &&
					Number.isFinite(s?.at)
			)
			.map((s) => ({ drops: s.drops, at: s.at }))
			.sort((a, b) => b.drops - a.drops || a.at - b.at)
			.slice(0, MAX_SCORES);
	} catch {
		return [];
	}
}

export function addScore(drops: number, at: number, storage?: Storage | null): Score[] {
	const next = [...loadScores(storage), { drops, at }]
		.sort((a, b) => b.drops - a.drops || a.at - b.at)
		.slice(0, MAX_SCORES);
	try {
		storageOrDefault(storage)?.setItem(SCORES, JSON.stringify(next));
	} catch {
		/* The board stays correct in memory for this visit. */
	}
	return next;
}
