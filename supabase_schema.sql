-- ============================================================
-- MILLIONAIRE JAMB EDITION — Full Schema Reset
-- Paste into Supabase SQL Editor and Run All
-- ============================================================

-- ⚡ MIGRATION ONLY (run this if tables already exist, skip the reset below)
-- alter table game_sessions add column if not exists selected_answer text;

-- ============================================================

-- 1. DROP existing tables cleanly (order matters due to FK)
drop table if exists chat_messages cascade;
drop table if exists game_sessions cascade;
drop table if exists questions cascade;

-- 2. QUESTIONS TABLE
create table questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,           -- 'English' | 'Physics' | 'Chemistry' | 'Biology'
  question text not null,
  options jsonb not null,          -- ["option1","option2","option3","option4"]
  answer text not null,            -- must match one of the options exactly
  difficulty text default 'Medium',
  created_at timestamptz default now()
);

-- 3. GAME SESSIONS TABLE
create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  current_question jsonb,
  prize_level int default 1,
  answer_result text,              -- 'correct' | 'wrong' | null
  audience_data jsonb,
  eliminated_options jsonb default '[]',
  selected_answer text,            -- Blessing's currently selected option
  timer_active boolean default false,
  timer_started_at timestamptz,    -- set when host starts timer, used to sync Blessing's countdown
  status text default 'lobby',     -- 'lobby' | 'active' | 'ended'
  created_at timestamptz default now()
);

-- 4. CHAT MESSAGES TABLE
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references game_sessions(id) on delete cascade,
  sender text not null,            -- 'NJAY' | 'Blessing'
  message text not null,
  created_at timestamptz default now()
);

-- 5. ROW LEVEL SECURITY
alter table questions enable row level security;
alter table game_sessions enable row level security;
alter table chat_messages enable row level security;

create policy "allow all questions"    on questions     for all using (true) with check (true);
create policy "allow all sessions"     on game_sessions for all using (true) with check (true);
create policy "allow all chat"         on chat_messages for all using (true) with check (true);

-- 6. REALTIME (run these separately if needed)
-- Dashboard → Database → Replication → enable for: questions, game_sessions, chat_messages

-- ============================================================
-- 7. QUESTIONS — English (20 questions)
-- ============================================================
insert into questions (subject, question, options, answer, difficulty) values

('English', 'Choose the word closest in meaning to "Benevolent".',
 '["Cruel","Kind","Angry","Lazy"]', 'Kind', 'Easy'),

('English', 'Which of the following is a synonym of "Eloquent"?',
 '["Fluent","Silent","Rude","Dull"]', 'Fluent', 'Easy'),

('English', 'Identify the figure of speech: "The wind whispered through the trees."',
 '["Simile","Metaphor","Personification","Hyperbole"]', 'Personification', 'Medium'),

('English', 'Choose the correct spelling.',
 '["Accomodate","Accommodate","Acommodate","Acomodate"]', 'Accommodate', 'Medium'),

('English', 'Which sentence is grammatically correct?',
 '["She don''t know","She doesn''t knows","She doesn''t know","She do not knows"]', 'She doesn''t know', 'Easy'),

('English', 'The plural of "criterion" is?',
 '["Criterions","Criteria","Criterias","Criterium"]', 'Criteria', 'Medium'),

('English', 'What is the antonym of "Verbose"?',
 '["Wordy","Concise","Loud","Vague"]', 'Concise', 'Medium'),

('English', '"She is the cat''s whiskers." This expression means she is?',
 '["Very fast","Excellent or outstanding","Very quiet","A cat lover"]', 'Excellent or outstanding', 'Hard'),

('English', 'Identify the part of speech of the underlined word: "He runs quickly."',
 '["Adjective","Noun","Adverb","Verb"]', 'Adverb', 'Easy'),

('English', 'Which of these is a collective noun?',
 '["Happiness","Flock","Running","Beautiful"]', 'Flock', 'Easy'),

('English', 'Choose the correct form: "Neither the boys nor the girl ___ present."',
 '["were","are","is","be"]', 'is', 'Hard'),

('English', 'What literary device is used in: "Peter Piper picked a peck of pickled peppers"?',
 '["Assonance","Alliteration","Onomatopoeia","Rhyme"]', 'Alliteration', 'Medium'),

('English', 'The word "Ambiguous" means?',
 '["Clear","Having more than one meaning","Impossible","Straightforward"]', 'Having more than one meaning', 'Medium'),

('English', 'Which of the following is a preposition?',
 '["Quickly","Beautiful","Beneath","Shout"]', 'Beneath', 'Easy'),

('English', '"To kick the bucket" means?',
 '["To play football","To die","To clean up","To start over"]', 'To die', 'Medium'),

('English', 'Identify the type of clause: "Although it was raining, we went out."',
 '["Noun clause","Relative clause","Adverbial clause","Main clause"]', 'Adverbial clause', 'Hard'),

('English', 'Which word is correctly hyphenated?',
 '["Well-known","Wellknown","Well known","Wel-known"]', 'Well-known', 'Medium'),

('English', 'The passive voice of "The dog bit the man" is?',
 '["The man was bitten by the dog","The man is bitten by the dog","The dog was biting the man","The man bit the dog"]', 'The man was bitten by the dog', 'Medium'),

('English', 'What is the meaning of the prefix "mis-" in "misunderstand"?',
 '["Again","Not or wrongly","Before","After"]', 'Not or wrongly', 'Easy'),

('English', 'Choose the word that best completes: "The jury ___ still deliberating."',
 '["is","are","were","have"]', 'is', 'Hard');

-- ============================================================
-- 8. QUESTIONS — Physics (20 questions)
-- ============================================================
insert into questions (subject, question, options, answer, difficulty) values

('Physics', 'What is the SI unit of electric current?',
 '["Volt","Watt","Ampere","Ohm"]', 'Ampere', 'Easy'),

('Physics', 'Which of the following is a vector quantity?',
 '["Mass","Temperature","Velocity","Speed"]', 'Velocity', 'Easy'),

('Physics', 'What is the speed of light in a vacuum?',
 '["3×10⁶ m/s","3×10⁸ m/s","3×10¹⁰ m/s","3×10⁴ m/s"]', '3×10⁸ m/s', 'Medium'),

('Physics', 'Newton''s second law of motion states that force equals?',
 '["mass × velocity","mass × acceleration","weight × speed","mass × distance"]', 'mass × acceleration', 'Easy'),

('Physics', 'Which type of wave does not require a medium to travel?',
 '["Sound wave","Water wave","Electromagnetic wave","Seismic wave"]', 'Electromagnetic wave', 'Medium'),

('Physics', 'The unit of electrical resistance is?',
 '["Ampere","Volt","Ohm","Watt"]', 'Ohm', 'Easy'),

('Physics', 'What phenomenon explains why a straw appears bent in water?',
 '["Reflection","Diffraction","Refraction","Dispersion"]', 'Refraction', 'Medium'),

('Physics', 'Which of the following is NOT a renewable energy source?',
 '["Solar","Wind","Coal","Hydroelectric"]', 'Coal', 'Easy'),

('Physics', 'The principle of conservation of energy states that energy can be?',
 '["Created but not destroyed","Destroyed but not created","Neither created nor destroyed","Both created and destroyed"]', 'Neither created nor destroyed', 'Medium'),

('Physics', 'What is the formula for kinetic energy?',
 '["mgh","½mv²","mv","Fd"]', '½mv²', 'Medium'),

('Physics', 'Which particle has a positive charge?',
 '["Electron","Neutron","Proton","Photon"]', 'Proton', 'Easy'),

('Physics', 'The process by which a solid changes directly to gas is called?',
 '["Evaporation","Condensation","Sublimation","Melting"]', 'Sublimation', 'Medium'),

('Physics', 'What is the unit of frequency?',
 '["Metre","Hertz","Newton","Pascal"]', 'Hertz', 'Easy'),

('Physics', 'Ohm''s law states that current is proportional to?',
 '["Resistance","Power","Voltage","Capacitance"]', 'Voltage', 'Medium'),

('Physics', 'Which colour of light has the highest frequency?',
 '["Red","Green","Yellow","Violet"]', 'Violet', 'Hard'),

('Physics', 'The gravitational acceleration on Earth''s surface is approximately?',
 '["9.8 m/s²","8.9 m/s²","10.8 m/s²","6.7 m/s²"]', '9.8 m/s²', 'Easy'),

('Physics', 'What type of mirror is used in car rear-view mirrors?',
 '["Concave","Plane","Convex","Parabolic"]', 'Convex', 'Medium'),

('Physics', 'Which law states that every action has an equal and opposite reaction?',
 '["Newton''s First Law","Newton''s Second Law","Newton''s Third Law","Hooke''s Law"]', 'Newton''s Third Law', 'Easy'),

('Physics', 'The half-life of a radioactive substance is the time taken for?',
 '["All atoms to decay","Half the atoms to decay","One atom to decay","The substance to double"]', 'Half the atoms to decay', 'Medium'),

('Physics', 'What does a transformer do?',
 '["Converts AC to DC","Changes voltage levels","Stores electrical energy","Measures current"]', 'Changes voltage levels', 'Medium');

-- ============================================================
-- 9. QUESTIONS — Chemistry (20 questions)
-- ============================================================
insert into questions (subject, question, options, answer, difficulty) values

('Chemistry', 'What is the chemical symbol for Gold?',
 '["Go","Gd","Au","Ag"]', 'Au', 'Easy'),

('Chemistry', 'What is the atomic number of Carbon?',
 '["4","6","8","12"]', '6', 'Easy'),

('Chemistry', 'Which gas is produced when an acid reacts with a metal carbonate?',
 '["Oxygen","Hydrogen","Carbon dioxide","Nitrogen"]', 'Carbon dioxide', 'Easy'),

('Chemistry', 'What is the pH of a neutral solution?',
 '["0","7","14","1"]', '7', 'Easy'),

('Chemistry', 'Which of the following is a noble gas?',
 '["Nitrogen","Oxygen","Argon","Chlorine"]', 'Argon', 'Easy'),

('Chemistry', 'The chemical formula for water is?',
 '["HO","H₂O","H₂O₂","HO₂"]', 'H₂O', 'Easy'),

('Chemistry', 'What type of bond is formed when electrons are shared between atoms?',
 '["Ionic bond","Covalent bond","Metallic bond","Hydrogen bond"]', 'Covalent bond', 'Medium'),

('Chemistry', 'Which element has the symbol "Fe"?',
 '["Fluorine","Iron","Francium","Fermium"]', 'Iron', 'Easy'),

('Chemistry', 'What is the process of a liquid turning into gas called?',
 '["Condensation","Sublimation","Evaporation","Freezing"]', 'Evaporation', 'Easy'),

('Chemistry', 'Which of the following is an example of a physical change?',
 '["Burning wood","Rusting iron","Melting ice","Cooking an egg"]', 'Melting ice', 'Medium'),

('Chemistry', 'The number of protons in an atom determines its?',
 '["Mass number","Atomic number","Neutron number","Electron shells"]', 'Atomic number', 'Medium'),

('Chemistry', 'What is the chemical formula for table salt?',
 '["KCl","NaCl","CaCl₂","MgCl₂"]', 'NaCl', 'Easy'),

('Chemistry', 'Which acid is found in the stomach?',
 '["Sulphuric acid","Nitric acid","Hydrochloric acid","Acetic acid"]', 'Hydrochloric acid', 'Medium'),

('Chemistry', 'What is the valency of Oxygen?',
 '["1","2","3","4"]', '2', 'Medium'),

('Chemistry', 'Which of the following is a mixture?',
 '["Water","Salt","Air","Carbon dioxide"]', 'Air', 'Medium'),

('Chemistry', 'The process of separating crude oil into its components is called?',
 '["Distillation","Filtration","Chromatography","Crystallisation"]', 'Distillation', 'Medium'),

('Chemistry', 'What is the chemical symbol for Sodium?',
 '["So","Sd","Na","Sn"]', 'Na', 'Easy'),

('Chemistry', 'Which of the following is an alkali metal?',
 '["Calcium","Magnesium","Potassium","Aluminium"]', 'Potassium', 'Medium'),

('Chemistry', 'Isotopes are atoms of the same element with different numbers of?',
 '["Protons","Electrons","Neutrons","Shells"]', 'Neutrons', 'Hard'),

('Chemistry', 'What colour does litmus paper turn in an acidic solution?',
 '["Blue","Green","Red","Yellow"]', 'Red', 'Easy');

-- ============================================================
-- 10. QUESTIONS — Biology (20 questions)
-- ============================================================
insert into questions (subject, question, options, answer, difficulty) values

('Biology', 'Which organelle is known as the powerhouse of the cell?',
 '["Nucleus","Ribosome","Mitochondria","Golgi body"]', 'Mitochondria', 'Easy'),

('Biology', 'What is the basic unit of life?',
 '["Tissue","Organ","Cell","Organism"]', 'Cell', 'Easy'),

('Biology', 'Which blood group is the universal donor?',
 '["A","B","AB","O"]', 'O', 'Medium'),

('Biology', 'Photosynthesis takes place in which organelle?',
 '["Mitochondria","Chloroplast","Nucleus","Vacuole"]', 'Chloroplast', 'Easy'),

('Biology', 'What is the function of the red blood cells?',
 '["Fight infection","Transport oxygen","Produce antibodies","Clot blood"]', 'Transport oxygen', 'Easy'),

('Biology', 'Which part of the brain controls balance and coordination?',
 '["Cerebrum","Medulla","Cerebellum","Hypothalamus"]', 'Cerebellum', 'Medium'),

('Biology', 'DNA stands for?',
 '["Deoxyribonucleic Acid","Diribonucleic Acid","Deoxyribonitric Acid","Dinitrogenous Acid"]', 'Deoxyribonucleic Acid', 'Easy'),

('Biology', 'Which vitamin is produced when skin is exposed to sunlight?',
 '["Vitamin A","Vitamin B","Vitamin C","Vitamin D"]', 'Vitamin D', 'Easy'),

('Biology', 'The process by which plants make food using sunlight is called?',
 '["Respiration","Transpiration","Photosynthesis","Digestion"]', 'Photosynthesis', 'Easy'),

('Biology', 'Which organ produces insulin?',
 '["Liver","Kidney","Pancreas","Stomach"]', 'Pancreas', 'Medium'),

('Biology', 'What is osmosis?',
 '["Movement of solute from high to low concentration","Movement of water from low to high solute concentration","Movement of gas through a membrane","Movement of ions against a gradient"]', 'Movement of water from low to high solute concentration', 'Hard'),

('Biology', 'How many chambers does the human heart have?',
 '["2","3","4","5"]', '4', 'Easy'),

('Biology', 'Which of the following is NOT a function of the skeleton?',
 '["Support","Protection","Movement","Digestion"]', 'Digestion', 'Easy'),

('Biology', 'The male reproductive cell is called?',
 '["Ovum","Zygote","Sperm","Embryo"]', 'Sperm', 'Easy'),

('Biology', 'Which gas do plants absorb during photosynthesis?',
 '["Oxygen","Nitrogen","Carbon dioxide","Hydrogen"]', 'Carbon dioxide', 'Easy'),

('Biology', 'What is the largest organ in the human body?',
 '["Heart","Liver","Lung","Skin"]', 'Skin', 'Medium'),

('Biology', 'Mitosis results in how many daughter cells?',
 '["1","2","4","8"]', '2', 'Medium'),

('Biology', 'Which of the following is a communicable disease?',
 '["Diabetes","Malaria","Hypertension","Sickle cell anaemia"]', 'Malaria', 'Medium'),

('Biology', 'The site of protein synthesis in a cell is the?',
 '["Nucleus","Mitochondria","Ribosome","Golgi apparatus"]', 'Ribosome', 'Medium'),

('Biology', 'Which enzyme breaks down starch in the mouth?',
 '["Pepsin","Lipase","Amylase","Trypsin"]', 'Amylase', 'Hard');
