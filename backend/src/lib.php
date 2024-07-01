<?php

/*
	API library class.
	==================
	A set of common functions used by the api system.
*/
class ApiLibrary {

	/* Returns a success, with a payload and execution time. */
	public function return_true ($payload) {
		/* Check payload. */
		$payload = isset($payload) ? $payload : "";

		/* Set the header. */
		header("Content-Type: application/json");
		header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
		header("Cache-Control: post-check=0, pre-check=0", false);
		header("Pragma: no-cache");

		/* Calculate the execution time. */
		global $start;
		$time = microtime();
		$time = explode(' ', $time);
		$time = $time[1] + $time[0];
		$finish = $time;
		$total_time = round(($finish - $start), 4);

		/* Print the response. */
		echo(json_encode(array(
			"success" => true,
			"payload" => $payload,
			"exec-speed" => $total_time,
		)));

		/* Return. */
		return true;
		exit;
	}

	/* Returns a success false, with an error as well as the execution time. */
	public function return_false ($error) {
		/* Check error. */
		$error = isset($error) ? $error : "";

		/* Set the header. */
		header("Content-Type: application/json");
		header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
		header("Cache-Control: post-check=0, pre-check=0", false);
		header("Pragma: no-cache");

		/* Calculate the execution time. */
		global $start;
		$time = microtime();
		$time = explode(' ', $time);
		$time = $time[1] + $time[0];
		$finish = $time;
		$total_time = round(($finish - $start), 4);

		/* Print the response. */
		echo(json_encode(array(
			"success" => false,
			"error" => $error,
			"exec-speed" => $total_time,
		)));

		/* Return. */
		return true;
		exit;
	}

	/* Sets a cookie to be served with the header. */
	public function set_cookie ($cName, $cValue, $cExDays) {
		/* Calc the expiary days. */
		$cExDays = isset($cExDays) ? $cExDays : 365;

		/* Use the php method with a calcukated timestamp. */
		setcookie($cName, $cValue, time() + (86400 * $cExDays));

		/* Return. */
		return true;
	}
}
?>
