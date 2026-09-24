import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDyOGkKssEqVQC_5pLt3SHG-dkZ-izVY1E',
  authDomain: 'solar-master-2002.firebaseapp.com',
  databaseURL: 'https://solar-master-2002-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'solar-master-2002',
  appId: '1:772216147587:web:427e59f1cc0f08958015b6',
};

let database;
try { database = getDatabase(initializeApp(firebaseConfig)); } catch { database = null; }

export function subscribeToActiveRound(onRound, onError) {
  if (!database) return () => {};
  return onValue(ref(database, 'activeRound'), (snapshot) => {
    const value = snapshot.val();
    if (value) onRound(value);
  }, onError);
}

export async function publishActiveRound(round, rounds) {
  if (!database || !round) return;
  await set(ref(database, 'activeRound'), {
    id: round.id, name: round.name, sites: round.sites, dateRange: round.dateRange || '',
    library: rounds, ts: Date.now(), by: 'admin',
  });
}
