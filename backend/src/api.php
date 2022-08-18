<?php
/*
	Load dependancies.
*/
require(__DIR__."/core.php");

/*
	The XaO Class.
	===================
	XaO Game APIs.
	mysql-u xao -piIgXcDTt5ZwHmsIaclp2
*/
class XaO_Api extends XaO_Core {
	/* Constructor */
	public function __construct () {
		Parent::__construct();
	}

	/*
		Process Request.
		===============
		The routing function.
	*/
	public function proccess_request ( $oSite = array(), $oApi ) {
		/* Localise the oSite. */
		$this->oSite = $oSite;		

		/* Switch to route the request's action. */
		switch ( isset( $this->oSite['pages'][0] ) ? $this->oSite['pages'][0] : '' ) {

			case 'create':
				/* Wanted to create new game. */
				return $this->api_create();
			break;

			case 'join':
				/* Wanted join. */
				return $this->api_join();
			break;

			case 'play':
				/* Wanted play. */
				return $this->api_play();
			break;

			case 'state':
				/* Wanted state. */
				return $this->api_state();
			break;

			case 'restart':
				/* Wanted restart. */
				return $this->api_restart();
			break;

			default:
				/* Action requested was not found. */
				return array(
					"error" => 1,
					"msg" => "This service does not contain that action."
				);
			break;
		}
		/* Return. */
		return;
	}

	/*
		Api Create
		=============
		Creates a stub record for a game, with player 1's id.
	*/
	private function api_create () {
		/* Generate the game. */
		$a_game = array(
			"game_code" => $this->generate_hash( 6 ),
			"p_one_code" => $this->generate_hash( 10 ),
			"p_two_code" => $this->generate_hash( 10 ),
			"game_turn" => 1,
			"game_status" => 0,
			"game_board" => "000000000"
		);

		/* Build SQL. */
		$s_sql  = "INSERT INTO xao_games ( `game_code`, `game_playerone`, `game_playertwo`, `game_turn`, `game_status`, `game_board`, `game_timestamp` ) ";
		$s_sql .= "VALUES ( '%s', '%s', '%s', %d, %d, '%s', now() );";

		/* Sprint into the sql. */
		$s_sql = sprintf( $s_sql, $a_game['game_code'], $a_game['p_one_code'], $a_game['p_two_code'], $a_game['game_turn'], $a_game['game_status'], $a_game['game_board'] );

		/* Query */
		$o_result = $this->oDatabase->query( $s_sql );

		/* Check for errors. */
		if ( ! $o_result ) {
			return array(
				"error" => 1,
				"message" => "Failed to create a new game: ". $this->oDatabase->error,
			);
		}

		/* Return player one info. */
		return array(
			"game_code" => $a_game["game_code"],
			"p_one_code" => $a_game["p_one_code"],
			"game_turn" => $a_game["game_turn"],
			"game_status" => $a_game["game_status"],
			"game_board" => $a_game["game_board"],
		);
	}

	/*
		Api Join
		=============
		Allows player 2 to join and authenticate with a game record.
	*/
	private function api_join () {
		/* Template game object. */
		$a_game = array(
			"game_code" => "",
			"p_two_code" => "",
			"game_turn" => 0,
			"game_status" => 0,
			"game_board" => "000000000"
		);

		/* Check for gamecode. */
		if ( ! isset($this->oSite["pages"][1] ) ) {
			return array(
				"error" => 1,
				"message" => "No game code specified to join.",
			);
		}

		/* Variables. */
		$p_gamecode = $this->sanatise_gamecode( $this->oSite["pages"][1] );

		/* Validate. */
		if ( ! isset( $p_gamecode ) ) {
			return array(
				"error" => 1,
				"message" => "No game code specified to join.",
			);
		}

		if ( ! preg_match( '/([A-Z0-9]{6})/', $p_gamecode ) ) {
			return array(
				"error" => 1,
				"message" => "The game code supplied is invalid.",
			);
		}

		/* Build sql. */
		$s_sql = "SELECT game_code, game_playertwo, game_turn, game_status, game_board FROM xao_games WHERE game_code = ?;";
		$s_sql = $this->oDatabase->prepare( $s_sql );

		/* Bind Params */
		$s_sql->bind_param( 's', $p_gamecode );

		/* Execute. */
		$o_result = $s_sql->execute();

		/* Check for error. */
		if ( ! $o_result ) {
			return array(
				"error" => 1,
				"message" => "Failed to join this game: ". $this->oDatabase->error,
			);
		}

		/* Bind results. */
		$s_sql->bind_result( $a_game["game_code"], $a_game["p_two_code"], $a_game["game_turn"], $a_game["game_status"], $a_game["game_board"] );

		/* Fetch the row and fill the game array. */
		$s_sql->fetch();

		/* If no game was found. */
		if ( empty( $a_game["game_code"] ) ) {
			return array(
				"error" => 1,
				"message" => "There isn't a game by this code."
			);
		}

		/* If game status is not 1 - i.e. 'in play', change it. */
		else if ( $a_game["game_status"] == 0 ) {
			/* Prepare. */
			$s_sql = "UPDATE xao_games SET `game_status` = 1 WHERE game_code = ?;";
			$s_sql = $this->oDatabase->prepare( $s_sql );

			/* Bind Params */
			$s_sql->bind_param( 's', $p_gamecode );

			/* Execute. */
			$s_sql->execute();

			/* Change the array before returning. */
			$a_game["game_status"] = 1;
		}
		/* If the game status is not 0, but 1, then don't give another code out (player two already recieved it). */
		else if ( $a_game["game_status"] == 1 ) {
			return array(
				"error" => 1,
				"message" => "This game has already been joined.",
			);
		}

		/* Return. */
		return array(
			"game_code" => $a_game["game_code"],
			"p_two_code" => $a_game["p_two_code"],
			"game_turn" => $a_game["game_turn"],
			"game_status" => $a_game["game_status"],
			"game_board" => $a_game["game_board"],
		);
	}

	/*
		Api Play
		=============
		Plays a turn on the game board.
	*/
	private function api_play () {
		/* Template game object. */
		$a_game = array(
			"game_code" => "",
			"p_one_code" => "",
			"p_two_code" => "",
			"game_turn" => 0,
			"game_status" => 0,
			"game_board" => "000000000"
		);

		/* Check for gamecode. */
		if ( ! isset($this->oSite["pages"][1] ) ) {
			return array(
				"error" => 1,
				"message" => "No game code given.",
			);
		}

		/* Check for playercode. */
		if ( ! isset($this->oSite["pages"][2] ) ) {
			return array(
				"error" => 1,
				"message" => "No player auth code given.",
			);
		}

		/* Check for tile number. */
		if ( ! isset($this->oSite["pages"][3] ) ) {
			return array(
				"error" => 1,
				"message" => "No tile number given.",
			);
		}

		/* Sanatise the gamecode. */
		$p_gamecode = $this->sanatise_gamecode( $this->oSite["pages"][1] );

		if ( ! preg_match( '/([A-Z0-9]{6})/', $p_gamecode ) ) {
			return array(
				"error" => 1,
				"message" => "The game code given is invalid.",
			);
		}

		/* Sanatise player code. */
		$p_playercode = explode(" ", urldecode( $this->oSite["pages"][2] ) )[0];
		$p_playercode = preg_replace( '/([^A-Z0-9])/', '', $p_playercode );
		$p_playercode = strtoupper( $p_playercode );

		if ( ! preg_match( '/([A-Z0-9]{10})/', $p_playercode ) ) {
			return array(
				"error"   => 1,
				"message" => "The player auth given is invalid.",
			);
		}

		/* Sanatise the tile number. */
		$p_tilenum = explode(" ", urldecode( $this->oSite["pages"][3] ) )[0];
		$p_tilenum = (int) $p_tilenum;

		/* Fail if it's not a number. */
		if ( ! is_int( $p_tilenum ) ) {
			return array(
				"error"   => 1,
				"message" => "The tile number given is invalid.",
			);
		}

		/* Is it between 1 and 9? */
		if ( $p_tilenum < 1 || $p_tilenum > 9 ) {
			return array(
				"error"   => 1,
				"message" => "The tile number given is not within allowed limits.",
			);
		}

		/* Ok, all should be good, so lets see if we can find a game, with that auth code. */
		$s_sql = "SELECT game_code, game_playerone, game_playertwo, game_turn, game_status, game_board FROM xao_games WHERE game_code = ?;";
		$s_sql = $this->oDatabase->prepare( $s_sql );

		/* Bind. */
		$s_sql->bind_param( 's', $p_gamecode );

		/* Execute. */
		$o_result = $s_sql->execute();

		/* Check for error. */
		if ( ! $o_result ) {
			return array(
				"error"   => 1,
				"message" => "Failed to play a turn on this game: ". $this->oDatabase->error,
			);
		}

		/* Bind results. */
		$s_sql->bind_result( $a_game["game_code"], $a_game["p_one_code"], $a_game["p_two_code"], $a_game["game_turn"], $a_game["game_status"], $a_game["game_board"] );

		/* Fetch */
		$s_sql->fetch();

		/* Check that the player we're serving is registered to this game... */
		if ( $p_playercode != $a_game["p_one_code"] && $p_playercode != $a_game["p_two_code"] ) {
			return array(
				"error"   => 1,
				"message" => "The player code given is not authorized to play on this game.",
			);
		}

		/* Ok, so no check if it's that player's turn. */
		$i_requesting_player = ( $p_playercode == $a_game["p_one_code"] ) ? 1 : 2;
		$i_next_turn = ( $p_playercode == $a_game["p_one_code"] ) ? 2 : 1;

		/* Error if it's no their turn. */
		if ( $i_requesting_player != $a_game["game_turn"] ) {
			return array(
				"error"   => 1,
				"message" => "It's not your turn yet.",
			);
		}

		/* Ok, so it's their turn... let's see if that grid space is taken. */
		if ( $a_game["game_board"][ $p_tilenum - 1 ] != "0" ) {
			return array(
				"error"   => 1,
				"message" => "This tile has already been played."
			);
		}

		/* Cool, so that tile is free, lets set it and save it. */
		$a_game["game_board"][ $p_tilenum - 1 ] = $i_requesting_player;
		$a_game["game_turn"] = $i_next_turn;

		/* Check for a win. */
		$win_check = $this->check_board_win( $a_game["game_board"] );

		/* Pass through the game info. */
		$a_game["won"]         = $win_check["won"];
		$a_game["player"]      = $win_check["player"];
		$a_game["combination"] = $win_check["combination"];

		/* If not won, check if it was the last turn. */
		$i_numempty = substr_count( $a_game["game_board"], "0" );

		/* If it was the last turn... */
		if ( $i_numempty == 0 && $a_game["won"] != 1 ) {
			$a_game["won"]         = 1;
			$a_game["player"]      = 3;
			$a_game["combination"] = "000";
			$a_game["game_status"] = 3;
		}

		/* If won, set in record. */
		if ( $a_game["won"] == 1 ) {
			$s_sql = "UPDATE xao_games SET `game_board` = ?, `game_turn` = ?, `game_status` = 3 WHERE `game_code` = ?;";
		}
		/* otherwise, just update the game board and turn. */
		else {
			$s_sql = "UPDATE xao_games SET `game_board` = ?, `game_turn` = ? WHERE `game_code` = ?;";
		}

		/* Prepare. */
		$s_sql = $this->oDatabase->prepare( $s_sql );

		/* Bind params. */
		if ( $a_game["won"] == 1 ) {
			$i_next_turn = ($a_game["game_turn"] == 1 ) ? 2 : 1;
			$s_sql->bind_param( 'sds', $a_game["game_board"], $i_next_turn, $p_gamecode );
		} else {
			$s_sql->bind_param( 'sds', $a_game["game_board"], $a_game["game_turn"], $p_gamecode );
		}

		/* Execute. */
		$o_result = $s_sql->execute();

		/* Check for error. */
		if ( ! $o_result ) {
			return array(
				"error" => 1,
				"message" => "Failed to play a turn on this game: ". $this->oDatabase->error,
			);
		}

		/* If not won, check if it was the last turn. */
		$i_numempty = substr_count( $a_game["game_board"], "0" );

		/* If it was the last turn... */
		if ( $i_numempty == 0 ) {
			return array(
				"game_code"   => $a_game["game_code"],
				"game_turn"   => $a_game["game_turn"],
				"game_status" => $a_game["game_status"],
				"game_board"  => $a_game["game_board"],
				"won"         => 1,
				"player"      => 3,
				"combination" => "000",
			);
		}

		/* Return */
		return array(
			"game_code"   => $a_game["game_code"],
			"game_turn"   => $a_game["game_turn"],
			"game_status" => $a_game["game_status"],
			"game_board"  => $a_game["game_board"],
			"won"         => $a_game["won"],
			"player"      => $a_game["player"],
			"combination" => $a_game["combination"],
		);
	}

	/*
		Api State
		=============
		Gives information about a game, like who's turn it is, the board state etc.
	*/
	private function api_state () {
		/* Template game object. */
		$a_game = array(
			"game_code" => "",
			"game_turn" => 0,
			"game_status" => 0,
			"game_board" => "000000000"
		);

		/* Check if the URL has a gamecode. */
		if ( ! isset( $this->oSite["pages"][1] ) ) {
			return array(
				"error" => 1,
				"message" => "No game code specified to retrieve status.",
			);
		}

		/* Check for the auth code. */
		if ( ! isset( $_POST["auth"] ) ) {
			return array(
				"error" => 1,
				"message" => "User auth code not provided.",
			);
		}

		/* Variables. */
		$p_gamecode = $this->sanatise_gamecode( $this->oSite["pages"][1] );
		$check_p_one = "";
		$check_p_two = "";

		/* Validate. */
		if ( ! isset( $p_gamecode ) ) {
			return array(
				"error" => 1,
				"message" => "No game code specified to retrieve status.",
			);
		}

		if ( ! preg_match( '/([A-Z0-9]{6})/', $p_gamecode ) ) {
			return array(
				"error" => 1,
				"message" => "The game code supplied is invalid.",
			);
		}

		/* Query for the game's status */
		$s_sql = "SELECT game_code, game_playerone, game_playertwo, game_turn, game_board, game_status FROM xao_games WHERE game_code = ?";

		/* Prepare statement. */
		$s_sql = $this->oDatabase->prepare( $s_sql );

		/* Assign variables */
		$s_sql->bind_param( 's', $p_gamecode );

		/* Execute. */
		$s_sql->execute();

		/* Assign object to be loaded. */
		$s_sql->bind_result( $a_game["game_code"], $check_p_one, $check_p_two, $a_game["game_turn"], $a_game["game_board"], $a_game["game_status"] );

		/* Execute. */
		$o_result = $s_sql->fetch();

		/* Check for error. */
		if ( ! $o_result ) {
			return array(
				"error" => 1,
				"message" => "Failed to find this game: $p_gamecode",
			);
		}

		/* If no game was found. */
		if ( empty( $a_game["game_code"] ) ) {
			return array(
				"error" => 1,
				"message" => "There isn't a game by this code."
			);
		}

		/* If this player isn't allowed to check this game... */
		if ( $_POST['auth'] != $check_p_one && $_POST['auth'] != $check_p_two ) {
			return array(
				"error" => 1,
				"message" => "You're not authorised to view this game."
			);
		}

		/* If the game has won, get the combination. */
		$win_check = $this->check_board_win( $a_game["game_board"] );

		if ( $win_check["won"] ) {
			/* The game has a winning board. */
			$a_game["won"]         = $win_check["won"];
			$a_game["player"]      = $win_check["player"];
			$a_game["combination"] = $win_check["combination"];
		} else if ( $a_game["game_status"] == 3 ) {
			/* The game was won but as a draw. */
			$a_game["won"]         = 1;
			$a_game["player"]      = 3;
			$a_game["combination"] = "000";
		}

		/* Return. */
		return $a_game;
	}

	/*
		Api Restart
		===========
		Set's the game to restart wanted for the first player that requested it.
		Then restarts the game when the second player accepts it.
	*/
	private function api_restart () {
		/* Template game object. */
		$a_game = array(
			"game_code" => "",
			"game_turn" => 0,
			"game_status" => 0,
			"game_board" => "000000000"
		);

		/* Check for game code... */
		if ( ! isset( $this->oSite["post"]["game_code"] ) ) {
			return array(
				"error" => 1,
				"message" => "No game code specified to retrieve status.",
			);
		}
		/* Next check if we have the player code. */
		if ( ! isset( $this->oSite["post"]["auth"] ) ) {
			return array(
				"error" => 1,
				"message" => "No game code specified to retrieve status.",
			);
		}

		/* If have everything, sanatise it. */
		$p_gamecode = $this->sanatise_gamecode( $this->oSite["post"]["game_code"] );

		$p_authcode = explode(" ", urldecode( $this->oSite["post"]["auth"] ) )[0];
		$p_authcode = preg_replace( '/([^A-Z0-9])/', '', $p_authcode );

		/* Player codes... to check if the requester is one. */
		$check_p_one = "";
		$check_p_two = "";

		/* Query for the game... to check everything is good. */
		$s_sql = "SELECT game_code, game_playerone, game_playertwo, game_turn, game_board, game_status FROM xao_games WHERE game_code = ?";

		/* Prepare statement. */
		$s_sql = $this->oDatabase->prepare( $s_sql );

		/* Assign variables */
		$s_sql->bind_param( 's', $p_gamecode );

		/* Execute. */
		$s_sql->execute();

		/* Assign object to be loaded. */
		$s_sql->bind_result( $a_game["game_code"], $check_p_one, $check_p_two, $a_game["game_turn"], $a_game["game_board"], $a_game["game_status"] );

		/* Execute. */
		$o_result = $s_sql->fetch();

		/* Check for error. */
		if ( ! $o_result ) {
			return array(
				"error" => 1,
				"message" => "Failed to find this game: $p_gamecode",
			);
		}

		/* Check that the player is valid. */
		if ( $p_authcode != $check_p_one && $p_authcode != $check_p_two ) {
			return array(
				"error" => 1,
				"message" => "You're not authorised to reset this game!"
			);
		}

		/* Check that the game is finished. */
		if ( $a_game["game_status"] != 3 && $a_game["game_status"] != 4 ) {
			return array(
				"error" => 1,
				"message" => "This game is still in play!"
			);
		}

		/* If the game is won but not in reset, then set it to reset. */
		if ( $a_game["game_status"] == 3 ) {
			$a_game["game_status"] = 4;
		}
		/* Otherwise, if it's in reset, make it active. */
		else if ( $a_game["game_status"] == 4 ) {
			$a_game["game_board"] = "000000000";
			$a_game["game_status"] = 1;
		}

		/* Update the game record. */
		$s_sql = "UPDATE xao_games SET `game_turn` = ?, `game_status` = ?, `game_board` = ? WHERE `game_code` = ?;";

		/* Prepare. */
		$s_sql = $this->oDatabase->prepare( $s_sql );

		/* Bind params. */
		$s_sql->bind_param( 'ddss', $a_game["game_turn"], $a_game["game_status"], $a_game["game_board"], $p_gamecode );

		/* Execute. */
		$o_result = $s_sql->execute();

		/* Check for error. */
		if ( ! $o_result ) {
			return array(
				"error" => 1,
				"message" => "Failed to "+ ( $a_game["game_status"] == 4 ? "ask for a rematch" : "reset the board" ) +" for this game: ". $this->oDatabase->error,
			);
		}

		/* Return. */
		return array(
			"game_code" => $a_game["game_code"],
			"game_turn" => $a_game["game_turn"],
			"game_status" => $a_game["game_status"],
			"game_board" => $a_game["game_board"],
		);
	}

	/*
		Generate Hash
		=============
		Generate a string of characters.
	*/
	public function generate_hash ( $length = 10, $characters = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' ) {
		/* Variables. */
		$charactersLength = strlen($characters);
		$randomString = '';

		/* Loop out the length needed... and add a random character. */
		for ($i = 0; $i < $length; $i++) {
			$randomString .= $characters[rand(0, $charactersLength - 1)];
		}

		/* Return. */
		return $randomString;
	}

	/*
		Check Board Win
		===============
		Checks if there were wins on a board.
	*/
	public function check_board_win ( $s_board ) {
		/* Combinations. */
		$combinations = array(
			/* Rows. */
			array( 1, 2, 3 ),
			array( 4, 5, 6 ),
			array( 7, 8, 9 ),
			/* Columns. */
			array( 1, 4, 7 ),
			array( 2, 5, 8 ),
			array( 3, 6, 9 ),
			/* Diagonals. */
			array( 1, 5, 9 ),
			array( 3, 5, 7 ),
		);

		/* Loop over them, and check. */
		foreach ( array(1, 2) as $playernum ) {
			foreach ( $combinations as $combination ) {
				if ( $s_board[ $combination[0] - 1 ] == strval($playernum) && $s_board[ $combination[1] - 1 ] == strval($playernum) && $s_board[ $combination[2] - 1 ] == strval($playernum) ) {
					return array(
						"won" => 1,
						"player" => $playernum,
						"combination" => $combination[0] . $combination[1] . $combination[2],
					);
				}
			}
		}

		/* No wins, so return nothing. */
		return array(
			"won" => 0,
			"player" => 0,
			"combination" => "000",
		);
	}

	/*
		Sanatise Gamecode
		=================
		Give it the raw string and it'll give you a clean version back!
	*/
	private function sanatise_gamecode ( $s_gamecode = "" ) {
		/* Remove spaces */
		$s_gamecode = explode(" ", htmlentities( $s_gamecode ) )[0];

		/* Make uppercase */
		$s_gamecode = strtoupper( $s_gamecode );

		/* Remove character not valid. */
		$s_gamecode = preg_replace( '/([^A-Z1-9])/', '', $s_gamecode );

		/* Return */
		return $s_gamecode;
	}
}
?>
