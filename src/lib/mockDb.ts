// Simple localStorage-backed mock database for synthetic data

export type MockId = string;

export interface MockUser {
  id: MockId;
  email: string;
}

export interface MockFood {
  id: MockId;
  user_id: MockId;
  name: string;
  calories_per_serving: number;
  serving_size: string;
  category: string;
  created_at: string;
}

export interface MockActivity {
  id: MockId;
  user_id: MockId;
  name: string;
  calories_per_minute: number;
  created_at: string;
}

export interface MockDailyLog {
  id: MockId;
  user_id: MockId;
  date: string; // YYYY-MM-DD
  total_calories_consumed: number;
  total_calories_burned: number;
  created_at: string;
  updated_at: string;
}

export interface MockFoodEntry {
  id: MockId;
  user_id: MockId;
  daily_log_id: MockId;
  food_id: MockId | null;
  food_name: string;
  calories: number;
  portions: number;
  meal_type: string;
  created_at: string;
}

export interface MockActivityEntry {
  id: MockId;
  user_id: MockId;
  daily_log_id: MockId;
  activity_id: MockId | null;
  activity_name: string;
  calories_burned: number;
  duration_minutes: number;
  created_at: string;
}

export interface MockProfile {
  id: MockId;
  user_id: MockId;
  daily_calorie_goal: number;
  created_at: string;
  updated_at: string;
}

type CollectionName =
  | 'users'
  | 'foods'
  | 'activities'
  | 'daily_logs'
  | 'food_entries'
  | 'activity_entries'
  | 'users_profile';

type CollectionMap = {
  users: MockUser[];
  foods: MockFood[];
  activities: MockActivity[];
  daily_logs: MockDailyLog[];
  food_entries: MockFoodEntry[];
  activity_entries: MockActivityEntry[];
  users_profile: MockProfile[];
};

const STORAGE_KEY = 'calorie-tracker-mockdb';

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readDb(): CollectionMap {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed: CollectionMap = {
      users: [],
      foods: [],
      activities: [],
      daily_logs: [],
      food_entries: [],
      activity_entries: [],
      users_profile: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as CollectionMap;
  } catch {
    const empty: CollectionMap = {
      users: [],
      foods: [],
      activities: [],
      daily_logs: [],
      food_entries: [],
      activity_entries: [],
      users_profile: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    return empty;
  }
}

function writeDb(db: CollectionMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const mockDb = {
  ensureUser(email: string): MockUser {
    const db = readDb();
    let user = db.users.find(u => u.email === email);
    if (!user) {
      user = { id: generateId(), email };
      db.users.push(user);
      writeDb(db);
    }
    return user;
  },

  getProfile(userId: MockId): MockProfile | null {
    const db = readDb();
    return db.users_profile.find(p => p.user_id === userId) || null;
  },

  upsertProfile(userId: MockId, dailyGoal: number): MockProfile {
    const db = readDb();
    let profile = db.users_profile.find(p => p.user_id === userId);
    const timestamp = nowIso();
    if (!profile) {
      profile = {
        id: generateId(),
        user_id: userId,
        daily_calorie_goal: dailyGoal,
        created_at: timestamp,
        updated_at: timestamp,
      };
      db.users_profile.push(profile);
    } else {
      profile.daily_calorie_goal = dailyGoal;
      profile.updated_at = timestamp;
    }
    writeDb(db);
    return profile;
  },

  listFoods(userId: MockId): MockFood[] {
    const db = readDb();
    return db.foods.filter(f => f.user_id === userId).sort((a,b) => (a.created_at < b.created_at ? 1 : -1));
  },

  addFood(userId: MockId, input: Omit<MockFood, 'id' | 'user_id' | 'created_at'>): MockFood {
    const db = readDb();
    const newFood: MockFood = {
      id: generateId(),
      user_id: userId,
      created_at: nowIso(),
      ...input,
    };
    db.foods.push(newFood);
    writeDb(db);
    return newFood;
  },

  updateFood(id: MockId, updates: Partial<Omit<MockFood, 'id' | 'user_id'>>): void {
    const db = readDb();
    const f = db.foods.find(x => x.id === id);
    if (f) {
      Object.assign(f, updates);
      writeDb(db);
    }
  },

  deleteFood(id: MockId): void {
    const db = readDb();
    db.foods = db.foods.filter(f => f.id !== id);
    writeDb(db);
  },

  listActivities(userId: MockId): MockActivity[] {
    const db = readDb();
    return db.activities.filter(a => a.user_id === userId).sort((a,b) => (a.created_at < b.created_at ? 1 : -1));
  },

  addActivity(userId: MockId, input: Omit<MockActivity, 'id' | 'user_id' | 'created_at'>): MockActivity {
    const db = readDb();
    const act: MockActivity = {
      id: generateId(),
      user_id: userId,
      created_at: nowIso(),
      ...input,
    };
    db.activities.push(act);
    writeDb(db);
    return act;
  },

  getOrCreateDailyLog(userId: MockId, date: string): MockDailyLog {
    const db = readDb();
    let log = db.daily_logs.find(l => l.user_id === userId && l.date === date);
    const timestamp = nowIso();
    if (!log) {
      log = {
        id: generateId(),
        user_id: userId,
        date,
        total_calories_consumed: 0,
        total_calories_burned: 0,
        created_at: timestamp,
        updated_at: timestamp,
      };
      db.daily_logs.push(log);
      writeDb(db);
    }
    return log;
  },

  findDailyLog(userId: MockId, date: string): MockDailyLog | null {
    const db = readDb();
    return db.daily_logs.find(l => l.user_id === userId && l.date === date) || null;
  },

  addFoodEntry(userId: MockId, logId: MockId, input: Omit<MockFoodEntry, 'id' | 'user_id' | 'daily_log_id' | 'created_at'>): void {
    const db = readDb();
    const entry: MockFoodEntry = {
      id: generateId(),
      user_id: userId,
      daily_log_id: logId,
      created_at: nowIso(),
      ...input,
    };
    db.food_entries.push(entry);
    const log = db.daily_logs.find(l => l.id === logId);
    if (log) {
      log.total_calories_consumed += entry.calories;
      log.updated_at = nowIso();
    }
    writeDb(db);
  },

  addActivityEntry(userId: MockId, logId: MockId, input: Omit<MockActivityEntry, 'id' | 'user_id' | 'daily_log_id' | 'created_at'>): void {
    const db = readDb();
    const entry: MockActivityEntry = {
      id: generateId(),
      user_id: userId,
      daily_log_id: logId,
      created_at: nowIso(),
      ...input,
    };
    db.activity_entries.push(entry);
    const log = db.daily_logs.find(l => l.id === logId);
    if (log) {
      log.total_calories_burned += entry.calories_burned;
      log.updated_at = nowIso();
    }
    writeDb(db);
  },

  listFoodEntriesByLog(logId: MockId) {
    const db = readDb();
    return db.food_entries.filter(e => e.daily_log_id === logId).sort((a,b) => (a.created_at > b.created_at ? 1 : -1));
  },

  listActivityEntriesByLog(logId: MockId) {
    const db = readDb();
    return db.activity_entries.filter(e => e.daily_log_id === logId).sort((a,b) => (a.created_at > b.created_at ? 1 : -1));
  },
};


