
-- Module 1: Stretches
CREATE TABLE public.stretches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_pt TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'static', -- dynamic, static, mobility
  target_muscles TEXT[] NOT NULL DEFAULT '{}',
  duration_seconds INTEGER NOT NULL DEFAULT 30,
  per_side BOOLEAN NOT NULL DEFAULT false,
  reps INTEGER, -- null if timed
  before_splits TEXT[] NOT NULL DEFAULT '{}',
  after_splits TEXT[] NOT NULL DEFAULT '{}',
  instruction_pt TEXT,
  gif_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stretches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active stretches" ON public.stretches FOR SELECT USING (active = true);

-- Module 2: Cardio Protocols
CREATE TABLE public.cardio_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_pt TEXT NOT NULL,
  protocol_type TEXT NOT NULL DEFAULT 'liss', -- liss, miss, hiit, incline_walking
  equipment TEXT NOT NULL DEFAULT 'treadmill', -- treadmill, elliptical, stair_climber, bike
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  total_duration_min INTEGER NOT NULL DEFAULT 30,
  estimated_calories INTEGER,
  phases JSONB NOT NULL DEFAULT '[]',
  min_score_experience INTEGER NOT NULL DEFAULT 0,
  recommended_for TEXT[] NOT NULL DEFAULT '{}',
  when_to_use TEXT NOT NULL DEFAULT 'standalone',
  weekly_progression JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cardio_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active cardio protocols" ON public.cardio_protocols FOR SELECT USING (active = true);

-- Module 3: Warmup Routines
CREATE TABLE public.warmup_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_pt TEXT NOT NULL,
  split_type TEXT NOT NULL, -- legs, upper, fullbody
  exercises JSONB NOT NULL DEFAULT '[]',
  total_duration_min INTEGER NOT NULL DEFAULT 5,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.warmup_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active warmup routines" ON public.warmup_routines FOR SELECT USING (active = true);

-- Module 4: Home Workout Templates
CREATE TABLE public.home_workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_pt TEXT NOT NULL,
  category TEXT NOT NULL, -- circuit, resistance_band, dumbbell, hiit, glute, active_recovery
  equipment TEXT NOT NULL DEFAULT 'bodyweight',
  duration_min INTEGER NOT NULL DEFAULT 20,
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  exercises JSONB NOT NULL DEFAULT '[]',
  format_description TEXT,
  rounds INTEGER NOT NULL DEFAULT 3,
  work_seconds INTEGER NOT NULL DEFAULT 30,
  rest_seconds INTEGER NOT NULL DEFAULT 15,
  rest_between_rounds INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active home templates" ON public.home_workout_templates FOR SELECT USING (active = true);

-- Seed: Stretches (Dynamic)
INSERT INTO public.stretches (name_pt, type, target_muscles, duration_seconds, per_side, reps, before_splits, after_splits, instruction_pt, sort_order) VALUES
('Rotação de quadril', 'dynamic', '{"hip_flexors","glutes"}', 30, true, NULL, '{"legs"}', '{}', 'Em pé, levanta o joelho e faz círculos largos com o quadril. 30 segundos cada lado.', 1),
('Balanço de perna frontal', 'dynamic', '{"hamstrings","quadriceps"}', 30, true, NULL, '{"legs"}', '{}', 'Segura em algo fixo e balança a perna pra frente e pra trás. 30 segundos cada lado.', 2),
('Balanço de perna lateral', 'dynamic', '{"adductors","abductors"}', 30, true, NULL, '{"legs"}', '{}', 'Segura em algo fixo e balança a perna pro lado. 30 segundos cada lado.', 3),
('Agachamento sem peso', 'dynamic', '{"quadriceps","glutes"}', 0, false, 10, '{"legs"}', '{}', 'Agachamento profundo sem peso, desce devagar e sobe. 10 repetições.', 4),
('Círculos de braço', 'dynamic', '{"shoulders","chest"}', 30, false, NULL, '{"upper"}', '{}', 'Braços abertos, faz círculos pequenos que vão ficando grandes. 30 segundos.', 5),
('Rotação de tronco', 'dynamic', '{"obliques","lower_back"}', 30, true, NULL, '{"upper","fullbody"}', '{}', 'Em pé, gira o tronco pra esquerda e pra direita. 30 segundos cada lado.', 6),
('Rotação de ombro com braço', 'dynamic', '{"rotator_cuff"}', 30, true, NULL, '{"upper"}', '{}', 'Braço esticado, faz rotações do ombro. 30 segundos cada lado.', 7),
('Cat-cow (gato-vaca)', 'dynamic', '{"spine","core"}', 0, false, 10, '{"legs","upper","fullbody"}', '{}', 'De quatro, alterna entre arquear e arredondar a coluna. 10 repetições.', 8),
('Inchworm (minhoca)', 'dynamic', '{"hamstrings","core","shoulders"}', 0, false, 5, '{"fullbody"}', '{}', 'Em pé, desce com as mãos até o chão e caminha até a prancha. Volta. 5 reps.', 9),
('Passo lateral com agachamento', 'dynamic', '{"glutes","adductors"}', 0, false, 10, '{"legs"}', '{}', 'Dá um passo largo pro lado e agacha. Alterna os lados. 10 reps.', 10);

-- Seed: Stretches (Static)
INSERT INTO public.stretches (name_pt, type, target_muscles, duration_seconds, per_side, reps, before_splits, after_splits, instruction_pt, sort_order) VALUES
('Alongamento de quadríceps em pé', 'static', '{"quadriceps"}', 30, true, NULL, '{}', '{"legs"}', 'Em pé, dobra o joelho e segura o pé atrás. Puxa o calcanhar pro bumbum. 30 segundos.', 1),
('Alongamento de posterior sentada', 'static', '{"hamstrings"}', 30, true, NULL, '{}', '{"legs"}', 'Sentada, estica uma perna e inclina o tronco pra frente. 30 segundos cada lado.', 2),
('Borboleta sentada', 'static', '{"adductors","hips"}', 30, false, NULL, '{}', '{"legs"}', 'Sentada, junta as solas dos pés e empurra os joelhos pra baixo. 30 segundos.', 3),
('Pombo (pigeon stretch)', 'static', '{"glutes","hips"}', 30, true, NULL, '{}', '{"legs"}', 'Uma perna dobrada na frente, outra esticada atrás. Inclina o tronco. 30 segundos cada lado.', 4),
('Alongamento de panturrilha na parede', 'static', '{"calves"}', 30, true, NULL, '{}', '{"legs","cardio"}', 'Mãos na parede, pé atrás com calcanhar no chão. Empurra o quadril pra frente. 30s cada lado.', 5),
('Alongamento de peitoral na parede', 'static', '{"chest"}', 30, true, NULL, '{}', '{"upper"}', 'Braço na parede em 90°, gira o corpo pra longe. 30 segundos cada lado.', 6),
('Alongamento de tríceps acima da cabeça', 'static', '{"triceps"}', 30, true, NULL, '{}', '{"upper"}', 'Braço atrás da cabeça, puxa o cotovelo com a outra mão. 30 segundos cada lado.', 7),
('Criança (child''s pose)', 'static', '{"back","shoulders"}', 30, false, NULL, '{}', '{"upper","legs","fullbody"}', 'Sentada nos calcanhares, estende os braços pra frente no chão. 30 segundos.', 8),
('Cobra (cobra stretch)', 'static', '{"abs","lower_back"}', 30, false, NULL, '{}', '{"fullbody","core"}', 'Deitada de barriga pra baixo, empurra o tronco pra cima com os braços. 30 segundos.', 9),
('Alongamento de trapézio lateral', 'static', '{"trapezius","neck"}', 30, true, NULL, '{}', '{"upper"}', 'Inclina a cabeça pro lado, puxa leve com a mão. 30 segundos cada lado.', 10),
('Cross-body shoulder stretch', 'static', '{"shoulders","deltoids"}', 30, true, NULL, '{}', '{"upper"}', 'Cruza o braço na frente do corpo e puxa com a outra mão. 30 segundos cada lado.', 11);

-- Seed: Stretches (Mobility - rest day)
INSERT INTO public.stretches (name_pt, type, target_muscles, duration_seconds, per_side, reps, before_splits, after_splits, instruction_pt, sort_order) VALUES
('Cat-cow (gato-vaca)', 'mobility', '{"spine"}', 60, false, NULL, '{}', '{}', 'De quatro, alterna entre arquear e arredondar a coluna. 1 minuto.', 1),
('Rotação torácica deitada', 'mobility', '{"thoracic_spine"}', 30, true, NULL, '{}', '{}', 'Deitada de lado, gira o tronco abrindo o braço pro outro lado. 30s cada.', 2),
('90/90 hip stretch', 'mobility', '{"hips"}', 30, true, NULL, '{}', '{}', 'Sentada com as pernas em 90°, inclina o tronco pra frente. 30s cada lado.', 3),
('World''s greatest stretch', 'mobility', '{"hips","spine","shoulders"}', 30, true, NULL, '{}', '{}', 'Afundo com rotação do tronco e braço pro alto. 30s cada lado.', 4),
('Pombo (pigeon)', 'mobility', '{"glutes","hips"}', 30, true, NULL, '{}', '{}', 'Perna da frente dobrada, perna de trás esticada. Inclina. 30s cada.', 5),
('Borboleta + inclinação frontal', 'mobility', '{"adductors"}', 60, false, NULL, '{}', '{}', 'Junta as solas dos pés e inclina pra frente. 1 minuto.', 6),
('Criança (child''s pose)', 'mobility', '{"back"}', 60, false, NULL, '{}', '{}', 'Sentada nos calcanhares, braços pra frente. 1 minuto de relaxamento.', 7),
('Alongamento de quadríceps deitada', 'mobility', '{"quadriceps"}', 30, true, NULL, '{}', '{}', 'Deitada de lado, puxa o pé atrás pro bumbum. 30s cada.', 8),
('Ponte de glúteos com pausa', 'mobility', '{"glutes"}', 0, false, 10, '{}', '{}', 'Ponte de glúteo segurando 3 segundos no alto. 10 repetições.', 9),
('Respiração diafragmática', 'mobility', '{"core"}', 60, false, NULL, '{}', '{}', 'Deitada de barriga pra cima, respira fundo pelo nariz enchendo a barriga. 1 minuto.', 10);

-- Seed: Cardio Protocols
INSERT INTO public.cardio_protocols (name_pt, protocol_type, equipment, difficulty_level, total_duration_min, estimated_calories, phases, min_score_experience, recommended_for, when_to_use) VALUES
('LISS Esteira Iniciante', 'liss', 'treadmill', 1, 40, 250,
 '[{"phase_name":"Aquecimento","start_min":0,"end_min":3,"speed_kmh":4.0,"incline_pct":0,"instruction_pt":"Começa caminhando tranquila pra aquecer"},{"phase_name":"Caminhada leve","start_min":3,"end_min":10,"speed_kmh":5.0,"incline_pct":1,"instruction_pt":"Mantém esse ritmo, respiração normal"},{"phase_name":"Caminhada moderada","start_min":10,"end_min":25,"speed_kmh":5.5,"incline_pct":2,"instruction_pt":"Você deve conseguir conversar nesse ritmo"},{"phase_name":"Caminhada forte","start_min":25,"end_min":35,"speed_kmh":5.5,"incline_pct":3,"instruction_pt":"Inclinação subiu! Aperta o bumbum na subida"},{"phase_name":"Volta à calma","start_min":35,"end_min":40,"speed_kmh":4.0,"incline_pct":0,"instruction_pt":"Desacelera e respira fundo"}]',
 0, '{"lose_weight","lose_and_tone"}', 'post_workout'),

('Incline Walking 12-3-30', 'incline_walking', 'treadmill', 2, 35, 300,
 '[{"phase_name":"Aquecimento","start_min":0,"end_min":5,"speed_kmh":3.0,"incline_pct":0,"instruction_pt":"Aquece caminhando no plano"},{"phase_name":"Incline Walk","start_min":5,"end_min":35,"speed_kmh":3.0,"incline_pct":12,"instruction_pt":"Inclinação máxima! Mantém o ritmo, não segura no corrimão"}]',
 3, '{"lose_weight","lose_and_tone"}', 'standalone'),

('HIIT Escada', 'hiit', 'stair_climber', 3, 25, 350,
 '[{"phase_name":"Aquecimento","start_min":0,"end_min":3,"level":4,"instruction_pt":"Começa devagar pra aquecer as pernas"},{"phase_name":"Intervalo forte","duration_seconds":30,"level":8,"instruction_pt":"AGORA! Sobe rápido por 30 segundos!","is_interval":true},{"phase_name":"Recuperação","duration_seconds":60,"level":4,"instruction_pt":"Desacelera, respira, recupera","is_interval":true},{"phase_name":"Volta à calma","start_min":22,"end_min":25,"level":3,"instruction_pt":"Acabou! Desacelera devagar"}]',
 5, '{"lose_weight"}', 'standalone'),

('HIIT Elíptico', 'hiit', 'elliptical', 2, 23, 280,
 '[{"phase_name":"Aquecimento","start_min":0,"end_min":3,"level":3,"instruction_pt":"Ritmo leve pra aquecer"},{"phase_name":"Intervalo forte","duration_seconds":30,"level":8,"instruction_pt":"Acelera! Braços puxando junto!","is_interval":true},{"phase_name":"Recuperação","duration_seconds":60,"level":4,"instruction_pt":"Recupera o fôlego","is_interval":true},{"phase_name":"Volta à calma","start_min":20,"end_min":23,"level":2,"instruction_pt":"Desacelera, você conseguiu!"}]',
 3, '{"lose_weight","lose_and_tone"}', 'complementary_day'),

('Cardio Bike Iniciante', 'liss', 'bike', 1, 30, 200,
 '[{"phase_name":"Aquecimento","start_min":0,"end_min":3,"level":2,"instruction_pt":"Pedala leve pra aquecer"},{"phase_name":"Pedalada moderada","start_min":3,"end_min":15,"level":5,"instruction_pt":"Ritmo constante, respiração controlada"},{"phase_name":"Pedalada forte","start_min":15,"end_min":25,"level":6,"instruction_pt":"Aumenta um pouco a resistência"},{"phase_name":"Volta à calma","start_min":25,"end_min":30,"level":2,"instruction_pt":"Diminui devagar e respira"}]',
 0, '{"lose_weight","lose_and_tone","general_fitness"}', 'post_workout');

-- Seed: Warmup Routines
INSERT INTO public.warmup_routines (name_pt, split_type, exercises, total_duration_min) VALUES
('Aquecimento — Pernas e Glúteos', 'legs',
 '[{"phase":"Cardio leve","name":"Marcha estacionária (joelhos altos)","duration":"2 min"},{"phase":"Mobilidade","name":"Rotação de quadril (círculos)","duration":"30s cada lado"},{"phase":"Mobilidade","name":"Balanço frontal de pernas","duration":"30s cada lado"},{"phase":"Mobilidade","name":"Agachamento profundo com pausa","duration":"5 reps (3s pausa)"},{"phase":"Ativação","name":"Ponte de glúteo (sem peso)","duration":"15 reps"},{"phase":"Ativação","name":"Clam shell (abertura de concha)","duration":"12 reps cada lado"}]',
 7),
('Aquecimento — Superiores', 'upper',
 '[{"phase":"Cardio leve","name":"Polichinelo leve","duration":"2 min"},{"phase":"Mobilidade","name":"Círculos de braço (pequenos → grandes)","duration":"30s"},{"phase":"Mobilidade","name":"Rotação de ombro","duration":"30s cada direção"},{"phase":"Mobilidade","name":"Rotação torácica em pé","duration":"30s cada lado"},{"phase":"Ativação","name":"Flexão no joelho (push-up modificado)","duration":"10 reps"},{"phase":"Ativação","name":"Band pull-apart ou remo leve","duration":"12 reps"}]',
 7),
('Aquecimento — Full Body / Circuito', 'fullbody',
 '[{"phase":"Cardio leve","name":"Corrida estacionária leve","duration":"2 min"},{"phase":"Mobilidade","name":"Inchworm (minhoca)","duration":"5 reps"},{"phase":"Mobilidade","name":"World''s greatest stretch","duration":"3 reps cada lado"},{"phase":"Ativação","name":"Agachamento sem peso","duration":"10 reps"},{"phase":"Ativação","name":"Flexão no joelho","duration":"8 reps"}]',
 6);

-- Seed: Home Workout Templates
INSERT INTO public.home_workout_templates (name_pt, category, equipment, duration_min, difficulty_level, exercises, format_description, rounds, work_seconds, rest_seconds, rest_between_rounds) VALUES
('Circuito Funcional Iniciante', 'circuit', 'bodyweight', 22, 1,
 '[{"order":1,"name":"Agachamento sem peso","focus":"Pernas, glúteos"},{"order":2,"name":"Flexão no joelho","focus":"Peito, tríceps"},{"order":3,"name":"Afundo alternado","focus":"Pernas, equilíbrio"},{"order":4,"name":"Prancha frontal","focus":"Core"},{"order":5,"name":"Elevação lateral de perna","focus":"Glúteo médio"},{"order":6,"name":"Mountain climber","focus":"Cardio, core"},{"order":7,"name":"Ponte de glúteo","focus":"Glúteos"},{"order":8,"name":"Abdominal crunch","focus":"Abdome"}]',
 '3 rodadas. 30s de trabalho + 15s de descanso. 60s entre rodadas.', 3, 30, 15, 60),

('Glúteo Express com Elástico', 'glute', 'resistance_band', 18, 1,
 '[{"order":1,"name":"Agachamento com elástico","focus":"Glúteos, pernas","sets":3,"reps":"12-15"},{"order":2,"name":"Abdução em pé com elástico","focus":"Glúteo médio","sets":3,"reps":"15 cada"},{"order":3,"name":"Ponte de glúteo com elástico","focus":"Glúteo máximo","sets":3,"reps":"15"},{"order":4,"name":"Kick-back com elástico","focus":"Glúteo","sets":3,"reps":"12 cada"}]',
 '4 exercícios, 3 séries cada, 12-15 reps. Elástico acima dos joelhos.', 3, 0, 0, 45),

('HIIT em Casa', 'hiit', 'bodyweight', 18, 2,
 '[{"order":1,"name":"Burpee modificado","focus":"Full body"},{"order":2,"name":"Agachamento com salto","focus":"Pernas, cardio"},{"order":3,"name":"Mountain climber","focus":"Core, cardio"},{"order":4,"name":"Flexão","focus":"Peito, tríceps"},{"order":5,"name":"Jumping jack","focus":"Cardio"},{"order":6,"name":"Prancha com toque no ombro","focus":"Core, estabilidade"}]',
 '4 rodadas. 30s trabalho + 15s descanso. 60s entre rodadas.', 4, 30, 15, 60),

('Treino Leve Ativo (Recuperação)', 'active_recovery', 'bodyweight', 15, 1,
 '[{"order":1,"name":"Caminhada estacionária","focus":"Cardio leve"},{"order":2,"name":"Cat-cow (gato-vaca)","focus":"Mobilidade coluna"},{"order":3,"name":"Ponte de glúteo lenta","focus":"Ativação"},{"order":4,"name":"Prancha frontal 20s","focus":"Core"},{"order":5,"name":"Respiração diafragmática","focus":"Relaxamento"}]',
 '2 rodadas leves. 30s cada exercício. Sem pressa.', 2, 30, 15, 30);
