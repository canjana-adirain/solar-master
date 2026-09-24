import { useCallback, useState } from 'react';
import {
  ACTIVE_ROUND_KEY, REACT_V2_ACTIVE_ROUND_KEY, REACT_V2_ROUNDS_KEY, ROUNDS_KEY,
} from '../constants.js';

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

export function useRounds(initialSites) {
  const [rounds, setRoundsState] = useState(() => {
    const originalRounds = readJson(ROUNDS_KEY, null);
    const savedRounds = originalRounds ?? readJson(REACT_V2_ROUNDS_KEY, []);
    if (originalRounds == null && savedRounds.length) localStorage.setItem(ROUNDS_KEY, JSON.stringify(savedRounds));
    return savedRounds;
  });
  const [activeRoundId, setActiveRoundIdState] = useState(() => {
    const originalActive = localStorage.getItem(ACTIVE_ROUND_KEY);
    const savedActive = originalActive || localStorage.getItem(REACT_V2_ACTIVE_ROUND_KEY);
    if (!originalActive && savedActive) localStorage.setItem(ACTIVE_ROUND_KEY, savedActive);
    return savedActive;
  });
  const activeRound = rounds.find((round) => round.id === activeRoundId) || null;

  const persist = useCallback((nextRounds, nextActive = activeRoundId) => {
    setRoundsState(nextRounds);
    localStorage.setItem(ROUNDS_KEY, JSON.stringify(nextRounds));
    if (nextActive) localStorage.setItem(ACTIVE_ROUND_KEY, nextActive);
    else localStorage.removeItem(ACTIVE_ROUND_KEY);
  }, [activeRoundId]);

  const addRound = useCallback(({ name, sites, dateRange = '', source = '' }) => {
    const round = {
      id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || `Round ${rounds.length + 1}`,
      sites, dateRange, source, addedAt: Date.now(),
    };
    const next = [...rounds, round];
    persist(next, round.id);
    setActiveRoundIdState(round.id);
    return round;
  }, [persist, rounds]);

  const deleteRound = useCallback((id) => {
    const next = rounds.filter((round) => round.id !== id);
    const nextActive = id === activeRoundId ? (next.at(-1)?.id || null) : activeRoundId;
    persist(next, nextActive);
    setActiveRoundIdState(nextActive);
  }, [activeRoundId, persist, rounds]);

  const selectRound = useCallback((id) => {
    setActiveRoundIdState(id);
    if (id) localStorage.setItem(ACTIVE_ROUND_KEY, id);
  }, []);

  const replaceFromCloud = useCallback((library, cloudActiveId) => {
    if (!Array.isArray(library)) return;
    persist(library, cloudActiveId || null);
    setActiveRoundIdState(cloudActiveId || null);
  }, [persist]);

  return {
    rounds, activeRoundId, activeRound, addRound, deleteRound, selectRound, replaceFromCloud,
    sites: activeRound?.sites || initialSites,
  };
}
