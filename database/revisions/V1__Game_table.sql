/*
	Game table.
	===========
*/
CREATE TABLE IF NOT EXISTS xao_games (
	game_id int NOT NULL AUTO_INCREMENT,
	game_code varchar(6) NOT NULL,
	game_playerone varchar(10) NOT NULL,
	game_playertwo varchar(10) NOT NULL,
	game_turn int(1) NOT NULL,
	game_board varchar(9) NOT NULL,
	game_status int(1) NOT NULL,
	game_timestamp timestamp NOT NULL,
	PRIMARY KEY (game_id)
);
/* Sets the auto increment so all games have a 5 digit UID. */
ALTER TABLE xao_games AUTO_INCREMENT=100000;
