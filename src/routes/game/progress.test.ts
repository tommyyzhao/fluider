import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels.js';
import {
	loadSound,
	saveSound,
	loadProgress,
	recordClear,
	saveProgress,
	unlocked,
	loadOnboarding,
	rememberOnboarding,
	loadScores,
	addScore,
} from './progress.js';
import type { Progress } from './types.js';

function memory(raw?: string): Storage {
	const values = new Map<string, string>(
		raw === undefined ? [] : [['verdigris-progress-v2', raw]]
	);
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key) => values.get(key) ?? null,
		key: (i) => [...values.keys()][i] ?? null,
		removeItem: (key) => {
			values.delete(key);
		},
		setItem: (key, value) => {
			values.set(key, value);
		},
	};
}
const empty = (): Progress => ({ version: 2, cleared: {}, finale: false });

describe('progress storage', () => {
	it('persists sound preferences and validates unavailable or malformed storage', () => {
		const storage = memory();
		expect(loadSound(null)).toEqual({ muted: false, volume: 0.7 });
		saveSound(true, 0.25, storage);
		expect(loadSound(storage)).toEqual({ muted: true, volume: 0.25 });
		storage.setItem('verdigris-sound-v2', '{"muted":"false","volume":4}');
		expect(loadSound(storage)).toEqual({ muted: false, volume: 1 });
		storage.setItem('verdigris-sound-v2', 'null');
		expect(loadSound(storage)).toEqual({ muted: false, volume: 0.7 });
		storage.setItem = () => {
			throw new Error('blocked');
		};
		expect(() => saveSound(false, 0.5, storage)).not.toThrow();
	});
	it('remembers only valid onboarding cues; tolerates absent and blocked storage', () => {
		const storage = memory();
		expect(loadOnboarding(null)).toEqual({});
		rememberOnboarding('pour', storage);
		rememberOnboarding('stir', storage);
		expect(loadOnboarding(storage)).toEqual({ pour: true, stir: true });
		storage.setItem(
			'verdigris-onboarding-v2',
			'{"pour":"yes","stir":true,"other":true}'
		);
		expect(loadOnboarding(storage)).toEqual({ stir: true });
		storage.setItem('verdigris-onboarding-v2', '{');
		expect(loadOnboarding(storage)).toEqual({});
		storage.setItem = () => {
			throw new Error('blocked');
		};
		expect(() => rememberOnboarding('pour', storage)).not.toThrow();
	});
	it('retains saved Fluider progression after branding changes', () => {
		const progress = { version: 2, cleared: { [LEVELS[0].id]: 2 }, finale: false };
		expect(loadProgress(memory(JSON.stringify(progress)))).toEqual(progress);
	});
	it('round trips under the versioned key', () => {
		const storage = memory();
		const p = recordClear(empty(), LEVELS[0].id, 2);
		saveProgress(p, storage);
		expect(storage.key(0)).toBe('verdigris-progress-v2');
		expect(loadProgress(storage)).toEqual(p);
	});
	it.each([
		'{',
		'null',
		'[]',
		'true',
		'42',
		'{"version":1,"cleared":{}}',
		'{"version":2}',
		'{"version":2,"cleared":[]}',
	])('defensively resets %s', (raw) => {
		expect(loadProgress(memory(raw))).toEqual(empty());
	});
	it('filters unknown ids, invalid scores, forged finale and prototype keys', () => {
		const raw = JSON.stringify({
			version: 2,
			cleared: {
				[LEVELS[0].id]: 3,
				[LEVELS[1].id]: -1,
				[LEVELS[2].id]: '3',
				retired: 4,
				obsolete: 1.5,
				unknown: 3,
				['__proto__']: 3,
			},
			finale: true,
		});
		expect(loadProgress(memory(raw))).toEqual({
			version: 2,
			cleared: { [LEVELS[0].id]: 3 },
			finale: false,
		});
	});
	it('ignores v1 keys rather than migrating old rooms', () => {
		const storage = memory();
		storage.setItem(
			'verdigris-progress-v1',
			JSON.stringify({
				version: 1,
				cleared: { 'two-springs': 3 },
				finale: true,
			})
		);
		expect(loadProgress(storage)).toEqual(empty());
	});
	it('blocked storage never throws; null/SSR storage needs no browser', () => {
		const storage = memory();
		storage.getItem = () => {
			throw new Error('blocked');
		};
		storage.setItem = () => {
			throw new Error('blocked');
		};
		expect(() => saveProgress(empty(), storage)).not.toThrow();
		expect(loadProgress(storage)).toEqual(empty());
		expect(loadProgress(null)).toEqual(empty());
		expect(loadProgress()).toEqual(empty());
		expect(() => saveProgress(empty(), null)).not.toThrow();
		expect(() => saveProgress(empty())).not.toThrow();
	});
	it('throwing localStorage getter never escapes', () => {
		const original = Object.getOwnPropertyDescriptor(
			globalThis,
			'localStorage'
		);
		Object.defineProperty(globalThis, 'localStorage', {
			configurable: true,
			get: () => {
				throw new Error('blocked getter');
			},
		});
		try {
			expect(loadProgress()).toEqual(empty());
			expect(() => saveProgress(empty())).not.toThrow();
		} finally {
			if (original) Object.defineProperty(globalThis, 'localStorage', original);
			else Reflect.deleteProperty(globalThis, 'localStorage');
		}
	});
});

describe('unlock order', () => {
	it('best score only; immutable; clamps input', () => {
		const p = empty();
		const first = recordClear(p, LEVELS[0].id, 2);
		expect(p).toEqual(empty());
		expect(recordClear(first, LEVELS[0].id, 1)).toEqual(first);
		expect(recordClear(first, LEVELS[0].id, 100).cleared[LEVELS[0].id]).toBe(3);
		expect(recordClear(first, LEVELS[1].id, 0).cleared[LEVELS[1].id]).toBe(1);
		expect(recordClear(first, LEVELS[1].id, NaN)).toEqual(first);
		expect(recordClear(first, 'unknown', 3)).toEqual(first);
	});
	it('requires contiguous clears; interlude must be explicitly marked seen', () => {
		let p = recordClear(empty(), LEVELS.at(-1)!.id, 3);
		expect(unlocked(p)).toBe(0);
		expect(p.finale).toBe(false);
		for (let i = 0; i < LEVELS.length; i++) {
			p = recordClear(p, LEVELS[i].id, 1);
			expect(unlocked(p)).toBe(Math.min(i + 1, LEVELS.length - 1));
		}
		expect(p.finale).toBe(false);
		p = { ...p, finale: true };
		const storage = memory();
		saveProgress(p, storage);
		expect(loadProgress(storage).finale).toBe(true);
	});
});

describe('local leaderboard', () => {
	const max = LEVELS.length * 3;
	it('ranks by dewdrops then age, keeps ten, and persists', () => {
		const storage = memory();
		for (let i = 0; i < 12; i++) addScore(i % max, 1000 + i, storage);
		const board = loadScores(storage);
		expect(board).toHaveLength(10);
		expect(board.map((s) => s.drops)).toEqual([...board.map((s) => s.drops)].sort((a, b) => b - a));
		expect(addScore(max, 5, storage)[0]).toEqual({ drops: max, at: 5 });
	});
	it('drops invalid entries and survives bad or blocked storage', () => {
		const bad = memory();
		bad.setItem('fluider-scores-v1', JSON.stringify([{ drops: 99, at: 1 }, { drops: 'x', at: 1 }, { drops: 3, at: 2 }]));
		expect(loadScores(bad)).toEqual([{ drops: 3, at: 2 }]);
		bad.setItem('fluider-scores-v1', '{');
		expect(loadScores(bad)).toEqual([]);
		expect(loadScores(null)).toEqual([]);
		expect(addScore(4, 9, null)).toEqual([{ drops: 4, at: 9 }]);
	});
});
