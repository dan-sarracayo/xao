/*
	Clean up event.
*/
DROP EVENT IF EXISTS `xao_game_cleaner`;
CREATE EVENT `xao_game_cleaner`
ON SCHEDULE
  EVERY 1 DAY_HOUR
  COMMENT 'Clean up games at 01:00 daily!'
  DO
    DELETE FROM xao_db.xao_games WHERE game_status = 3 OR game_timestamp < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 180 DAY));