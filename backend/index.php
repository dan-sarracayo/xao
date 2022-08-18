<?php
	/* Setup some global timing variables. */
	$time = microtime();
	$time = explode(' ', $time);
	$time = $time[1] + $time[0];
	$start = $time;

	/* Show errors. */
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);

	/* Set cors header. */
	require('./config/config.php');
	$a_permitted_origins = $o_config["cors"];
	if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $a_permitted_origins)) {
		header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
		header("Access-Control-Allow-Methods: GET, POST");
		header("Access-Control-Allow-Headers: X-Requested-With");
	}

	/* Instansiate the API library. */
	require('./src/lib.php');
	$oApi = new ApiLibrary;

	/*
		Collect information about the request.
		and build the oSite object of information.
	*/
	$sRequestUrl = "https://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
	if ( substr( $sRequestUrl, strlen($sRequestUrl) - 1, strlen($sRequestUrl) ) == "/" ) {
		$sRequestUrl = substr( $sRequestUrl, 0, -1 );
	}
	$aPages = explode( "/", parse_url($sRequestUrl, PHP_URL_PATH) );
	array_shift( $aPages ); // shifted to remove the empty first elm.
	$oSite = array(
		"get" => $_GET,        // Url parameters passed.
		"post" => $_POST,      // Post body parameters.
		"pages" => $aPages,    // Url pseudo folders passed.
		"cookies" => $_COOKIE, // Cookies in header.
	);

	/*
		Route the request.
	*/
	/* Pull in the class. */
	require(__DIR__ ."/src/api.php");
	$oXao = new XaO_Api();
	/* Pass the request. */
	$oApi->return_true( $oXao->proccess_request( $oSite, $oApi ) );

	/**
	 * Disabled top level switch.
	 */
	// switch ( isset($oSite["pages"][0]) ? $oSite["pages"][0] : '' ) {

	// 	/* API Service requested. */
	// 	case "api":
	// 		/* Pull in the class. */
	// 		require(__DIR__ ."/src/api.php");
	// 		$oXao = new XaO_Api();
	// 		/* Pass the request. */
	// 		$oApi->return_true( $oXao->proccess_request( $oSite ) );
	// 	break;

	// 	default:
	// 		/* Dunno APIs. */
	// 		$oApi->return_true(array(
	// 			"error" => 1,
	// 			"errormsg" => "Unrecognised request."
	// 		));
	// 	break;

	// }
?>
