-- Hustle for Life - Database Schema
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MEALS & NUTRITION
-- ============================================

CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    meal_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    description TEXT NOT NULL,
    calories INTEGER,
    protein_g DECIMAL(5,1),
    carbs_g DECIMAL(5,1),
    fat_g DECIMAL(5,1),
    fiber_g DECIMAL(5,1),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meals_time ON meals(meal_time);

-- ============================================
-- HYDRATION
-- ============================================

CREATE TABLE hydration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount_oz DECIMAL(5,1) NOT NULL,
    beverage_type VARCHAR(50) DEFAULT 'water',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hydration_time ON hydration(logged_at);

-- ============================================
-- VITALS
-- ============================================

CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vital_type VARCHAR(30) NOT NULL CHECK (vital_type IN (
        'blood_pressure',
        'blood_sugar',
        'heart_rate',
        'temperature',
        'oxygen_saturation',
        'respiratory_rate'
    )),
    -- Blood pressure
    systolic INTEGER,
    diastolic INTEGER,
    -- Blood sugar
    glucose_mg_dl INTEGER,
    glucose_context VARCHAR(20) CHECK (glucose_context IN ('fasting', 'before_meal', 'after_meal', 'bedtime', 'random')),
    -- Heart rate
    bpm INTEGER,
    hrv_ms INTEGER,
    -- Temperature
    temp_f DECIMAL(4,1),
    -- Oxygen
    spo2_percent INTEGER,
    -- General
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vitals_time ON vitals(logged_at);
CREATE INDEX idx_vitals_type ON vitals(vital_type);

-- ============================================
-- WEIGHT & BODY COMPOSITION
-- ============================================

CREATE TABLE weight (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    weight_lbs DECIMAL(5,1) NOT NULL,
    body_fat_percent DECIMAL(4,1),
    muscle_mass_lbs DECIMAL(5,1),
    water_percent DECIMAL(4,1),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weight_time ON weight(logged_at);

-- ============================================
-- SLEEP
-- ============================================

CREATE TABLE sleep (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sleep_date DATE NOT NULL UNIQUE,
    bedtime TIMESTAMP WITH TIME ZONE,
    wake_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    deep_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    light_sleep_minutes INTEGER,
    awake_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sleep_date ON sleep(sleep_date);

-- ============================================
-- MOOD & MENTAL HEALTH
-- ============================================

CREATE TABLE mood (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mood_rating INTEGER NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
    energy_rating INTEGER CHECK (energy_rating BETWEEN 1 AND 5),
    stress_rating INTEGER CHECK (stress_rating BETWEEN 1 AND 5),
    anxiety_rating INTEGER CHECK (anxiety_rating BETWEEN 1 AND 5),
    emotions TEXT[], -- Array of emotion tags
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mood_time ON mood(logged_at);

CREATE TABLE gratitude (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    entry_date DATE NOT NULL,
    items TEXT[] NOT NULL, -- Array of gratitude items
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gratitude_date ON gratitude(entry_date);

CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reflection_date DATE NOT NULL,
    reflection_type VARCHAR(20) CHECK (reflection_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    wins TEXT[],
    challenges TEXT[],
    lessons TEXT[],
    goals_next TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reflections_date ON reflections(reflection_date);

-- ============================================
-- ACTIVITY & EXERCISE
-- ============================================

CREATE TABLE activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activity_date DATE NOT NULL,
    steps INTEGER,
    distance_miles DECIMAL(5,2),
    floors_climbed INTEGER,
    active_minutes INTEGER,
    calories_burned INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_date ON activity(activity_date);

CREATE TABLE exercise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    exercise_type VARCHAR(50) NOT NULL,
    intensity VARCHAR(20) CHECK (intensity IN ('light', 'moderate', 'vigorous')),
    calories_burned INTEGER,
    heart_rate_avg INTEGER,
    heart_rate_max INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exercise_time ON exercise(start_time);

-- ============================================
-- MEDICATIONS
-- ============================================

CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    times_of_day TEXT[],
    start_date DATE,
    end_date DATE,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE medication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID REFERENCES medications(id),
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dosage_taken VARCHAR(50),
    skipped BOOLEAN DEFAULT FALSE,
    skip_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_med_logs_time ON medication_logs(taken_at);

-- ============================================
-- CHECK-INS (Consolidated snapshots)
-- ============================================

CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_in_type VARCHAR(20) CHECK (check_in_type IN ('morning', 'afternoon', 'evening', 'full')),
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
    energy_rating INTEGER CHECK (energy_rating BETWEEN 1 AND 5),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
    ate_breakfast BOOLEAN,
    ate_lunch BOOLEAN,
    ate_dinner BOOLEAN,
    water_glasses INTEGER,
    steps INTEGER,
    exercise_done BOOLEAN,
    medications_taken BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checkins_time ON check_ins(logged_at);

-- ============================================
-- GOALS & TARGETS
-- ============================================

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(30) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    target_unit VARCHAR(20),
    frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default goals
INSERT INTO goals (category, metric, target_value, target_unit, frequency) VALUES
    ('sleep', 'duration', 8, 'hours', 'daily'),
    ('sleep', 'bedtime', 22.5, 'hour_24', 'daily'),  -- 10:30 PM
    ('hydration', 'water', 64, 'oz', 'daily'),
    ('activity', 'steps', 10000, 'steps', 'daily'),
    ('activity', 'exercise', 30, 'minutes', 'daily'),
    ('nutrition', 'meals_logged', 3, 'meals', 'daily'),
    ('mental', 'mood_checkins', 2, 'checkins', 'daily');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Daily summary view
CREATE VIEW daily_summary AS
SELECT
    d.date,
    -- Sleep
    s.duration_minutes / 60.0 as sleep_hours,
    s.quality_rating as sleep_quality,
    -- Meals
    (SELECT COUNT(*) FROM meals m WHERE DATE(m.meal_time) = d.date) as meals_logged,
    -- Hydration
    (SELECT COALESCE(SUM(amount_oz), 0) FROM hydration h WHERE DATE(h.logged_at) = d.date) as water_oz,
    -- Activity
    a.steps,
    a.active_minutes,
    -- Mood (average of day)
    (SELECT ROUND(AVG(mood_rating), 1) FROM mood mo WHERE DATE(mo.logged_at) = d.date) as avg_mood
FROM
    generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE,
        '1 day'::interval
    ) AS d(date)
LEFT JOIN sleep s ON s.sleep_date = d.date
LEFT JOIN activity a ON a.activity_date = d.date;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate streak for a metric
CREATE OR REPLACE FUNCTION calculate_streak(
    p_table_name TEXT,
    p_date_column TEXT,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    check_date DATE := p_end_date;
    has_entry BOOLEAN;
BEGIN
    LOOP
        EXECUTE format(
            'SELECT EXISTS(SELECT 1 FROM %I WHERE DATE(%I) = $1)',
            p_table_name,
            p_date_column
        ) INTO has_entry USING check_date;

        IF has_entry THEN
            streak := streak + 1;
            check_date := check_date - 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS (adjust as needed)
-- ============================================

-- Grant all privileges to the hustle user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hustle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hustle;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hustle;
