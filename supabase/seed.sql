-- Run after 001_epoch_schema.sql and 002_automatic_teams.sql.
insert into public.epoch_games (game_name,quiz_code,game_status)
values ('EPOCH FRESHERS CHALLENGE 2026','EPOCH26','LOBBY')
on conflict (quiz_code) do nothing;

with game as (select epoch_game_id from public.epoch_games where quiz_code='EPOCH26')
insert into public.epoch_questions (epoch_game_id,round_number,question_number,question_text,options,correct_option,time_limit_seconds,points,scoring_config) values
((select epoch_game_id from game),1,1,'Which programming language is primarily known as the backbone of web interactivity alongside HTML and CSS?','["JavaScript","Python","C++","Java"]',0,30,100,null),
((select epoch_game_id from game),1,2,'What does ''AI'' stand for in modern technology?','["Automated Information","Artificial Intelligence","Algorithm Interface","Applied Internet"]',1,30,100,null),
((select epoch_game_id from game),1,3,'Which planet in our solar system is famously known as the ''Red Planet''?','["Venus","Jupiter","Mars","Saturn"]',2,30,100,null),
((select epoch_game_id from game),1,4,'What is the primary role of RAM in a computer system?','["High-speed temporary working memory","Permanent long-term file storage","Cooling the internal processor","Supplying electric power"]',0,30,100,null),
((select epoch_game_id from game),1,5,'Who is widely celebrated as the father of modern Computer Science and Artificial Intelligence?','["Charles Babbage","Alan Turing","Steve Jobs","Ada Lovelace"]',1,30,100,null),
((select epoch_game_id from game),2,1,'Which fundamental data structure operates strictly on a First-In, First-Out (FIFO) principle?','["Stack","Queue","Binary Tree","Graph"]',1,30,100,null),
((select epoch_game_id from game),2,2,'What does the abbreviation ''URL'' stand for in web addressing?','["Uniform Resource Locator","Universal Routing Logic","Unified Radio Link","Unique Reference Line"]',0,30,100,null),
((select epoch_game_id from game),2,3,'Which technology giant developed and open-sourced the TypeScript programming language?','["Google","Microsoft","Meta","Amazon"]',1,30,100,null),
((select epoch_game_id from game),2,4,'What is the mathematical value of 2 raised to the 8th power (2^8)?','["128","256","512","1024"]',1,30,100,null),
((select epoch_game_id from game),2,5,'Which network protocol is used to encrypt and securely transfer web pages over the internet?','["HTTP","FTP","HTTPS","SMTP"]',2,30,100,null)
on conflict (epoch_game_id,round_number,question_number) do nothing;

