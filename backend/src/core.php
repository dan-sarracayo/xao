<?php

/*
	The Core XaO Class.
	===================
	Methods used by both auth and app.
*/
class XaO_Core {

	/* Database property. */
	public $oDatabase;

	/* Constructor. */
	public function __construct () {
		/* Setup the database. */
		$this->mysql_db_object();
	}

	/* Desctruct. */
	public function __destruct () {
		/* Close the SQL connection. */
		if ( is_object( $this->oDatabase ) ) {
			$this->oDatabase->close();
		}
	}

	/*
		MySQL DB Object.
		================
		Creates a mysqli object and assigns it as a property to this class.
	*/
	public function mysql_db_object () {
		require(__DIR__.'/../config/config.php');
		$o_db_creds = $o_config["database"];

		/* Variables. */
		$sUser = $o_db_creds["user"];     // Username.
		$sHost = $o_db_creds["host"];     // Host.
		$sPass = $o_db_creds["password"]; // Password.
		$sBase = $o_db_creds["schema"];   // Database for this project.

		/* Instantiate a connection. */
		$this->oDatabase = new mysqli($sHost, $sUser, $sPass, $sBase);

		/* Check the connection. */
		if ( $this->oDatabase->connect_error ) {
			die("Database Connection failed: " . $this->oDatabase->connect_error );
		}

		/* Return. */
		return true;
	}

}
?>
