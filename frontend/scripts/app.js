(function () {
	window.app = {
		"user": {},
		"apihost": "//api.xao.local",
		"strings": {
			"wait-ready": '<i class="fa fa-check"></i> Ready',
			"wait-waiting": '<i class="fa fa-refresh fa-spin"></i> Waiting',
			"wait-connecting": '<i class="fa fa-spinner fa-spin"></i> Joining',
			"game-voted": "Voted <i class='fa fa-check'></i>",
			"prompt-you-voted": "You voted rematch!",
			"prompt-they-voted": "They want to rematch!",
		},
		"intervals": {
			/* Waiting times for intervals - in seconds. */
			"player-2-join": 4, // When game created, wating for player 2.
			"switch-to-game": 1.5, // When player 2 joins, waiting to switch to game screen.
			"ingame-polling": 2, // When waiting for the opposite player - in game.
		},
		"isandroid": /Android/.test(window.navigator.userAgent),
		"isiphone": /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
		"isphone": function () { return app.isandroid || app.isiphone },
		"views": {
			"home": {
				"pane": document.getElementById("view-create"),
				"render": function () {
					/* Pre-pop the field if a hash is found. */
					if (window.location.hash) {
						document.getElementById("join-game-code").value = String(window.location.hash).split("#")[1];
						window.history.pushState({}, "XaO", "/");
					}

					/* Remove button working symbols. */
					document.getElementById("bttn-join-game").classList.remove("working");
					document.getElementById("bttn-start-game").classList.remove("working");
				}
			},
			"wait": {
				"pane": document.getElementById("view-wait"),
				"render": function () {
					/* Set gamecode.. */
					document.getElementById("game-code").innerHTML = app.user["game"];

					/* Set social buttons. */
					var
						url = window.location.href,
						fbmessage = encodeURI(url + "" + app.user["game"]),
						message = encodeURI("Come join my XaO game at " + url + "" + app.user["game"] + "");

					/* Update sharing links, based on what device we're on. */
					if (app.isphone()) {
						/* Mobile links. */
						document.getElementById("fb-messenger").href = "fb-messenger://share/?link=" + message;
						document.getElementById("twitter-share").href = "twitter://post?message=" + message;
						document.getElementById("whatsapp-share").href = "whatsapp://send?text=" + message;
					} else {
						/* Desktop links. */
						document.getElementById("whatsapp-share").parentNode.style.display = "none";
						document.getElementById("fb-messenger").getElementsByTagName("img")[0].alt = "Facebook";
						document.getElementById("fb-messenger").getElementsByTagName("img")[0].src = "/images/vendor/fb-logo.png";
						document.getElementById("fb-messenger").href = "https://www.facebook.com/sharer.php?u=" + fbmessage;
						document.getElementById("twitter-share").href = "https://twitter.com/intent/tweet?text=" + message;
					}

					/* Setup the UI... based on the user journey. */
					var
						pOneText = document.getElementById("p-one-wait"),
						pTwoText = document.getElementById("p-two-wait");
					if (app.user["route"] == "rejoin" || app.user["route"] == "join") {
						/* Setup text based on joining or rejoining as player 1 or 2. */
						pOneText.classList.remove(app.user.player == 1 ? "green" : "amber");
						pOneText.classList.add(app.user.player == 1 ? "amber" : "green");
						pOneText.innerHTML = app.user.player == 1 ? app.strings["wait-connecting"] : app.strings["wait-ready"];
						pTwoText.classList.remove(app.user.player == 2 ? "green" : "amber");
						pTwoText.classList.add(app.user.player == 2 ? "amber" : "green");
						pTwoText.innerHTML = app.user.player == 2 ? app.strings["wait-connecting"] : app.strings["wait-ready"];

						/* Setup title and description. */
						if (app.user["route"] == "join") {
							document.getElementById("waiting-title-action").innerHTML = "joined";
							document.getElementById("waiting-title-description").innerHTML = "We're just connecting you...";
						} else {
							document.getElementById("waiting-title-action").innerHTML = "already joined";
							document.getElementById("waiting-title-description").innerHTML = "We're just re-connecting you...";
						}

						/* Loop over maker only - elemnts that are for the created screen. */
						var i, hide = document.getElementsByClassName("waiting-maker-only");
						for (i = 0; i < hide.length; i++) {
							hide[i].style.display = "none";
						}
					} else if (app.user.route == "rematch") {
						/* Rejoining but after a vote for rematch. */
						document.getElementById("waiting-title-action").innerHTML = "voted to rematch";
						document.getElementById("waiting-title-description").innerHTML = "We're just setting the game up...";

						/* Loop over maker only - elemnts that are for the created screen. */
						var i, hide = document.getElementsByClassName("waiting-maker-only");
						for (i = 0; i < hide.length; i++) {
							hide[i].style.display = "none";
						}
					} else {
						/* Not joining or rejoining... so created a game. */
						pOneText.classList.remove("amber");
						pOneText.classList.add("green");
						pOneText.innerHTML = app.strings["wait-ready"];
						pTwoText.classList.remove("green");
						pTwoText.classList.add("amber");
						pTwoText.innerHTML = app.strings["wait-waiting"];

						/* Setup title. */
						document.getElementById("waiting-title-action").innerHTML = "created";
						document.getElementById("waiting-title-description").innerHTML = "";

						/* Ensure the maker-only elements are showing. */
						var i, hide = document.getElementsByClassName("waiting-maker-only");
						for (i = 0; i < hide.length; i++) {
							if (hide[i].tagName == "P") hide[i].style.display = "block";
							else hide[i].style.display = "inline-block";
						}
					}

					/* Set polling interval. */
					app.views.wait.interval = setInterval(function () {
						QJAX.post({
							"url": app.apihost + "/state/" + app.user["game"],
							"params": {
								"gamecode": app.user.game,
								"auth": app.user.code,
							},
							"callback": function (data) {
								/* Objectify. */
								data = JSON.parse(data);

								/* Check for success... */
								if (data.success) {
									/* If an error... */
									if (data.payload.error) {
										/* Display. */
										alert(data.payload.message);

										/* Send home and clear data. */
										app.user["game"] = "";
										app.user["code"] = "";
										cookies.del("xao_game");
										clearInterval(app.views.wait.interval);
										app.switch_view("home");
									}
									/* If the game is in play... */
									else if (data.payload["game_status"] != 0) {
										/* The game has started.. so set UI. */
										if (app.user.player == 1 && data.payload["game_status"] == 1) {
											var pTwoText = document.getElementById("p-two-wait");
											pTwoText.classList.remove("amber");
											pTwoText.classList.add("green");
											pTwoText.innerHTML = app.strings["wait-ready"];
										}

										/* Clear this polling interval. */
										clearInterval(app.views.wait.interval);

										/* Move to the game screen. */
										setTimeout(function () {
											app.user["route"] = "rejoin";
											cookies.set("xao_game", JSON.stringify(app.user), 0.5);
											app.switch_view("game");
										}, app.intervals["switch-to-game"] * 1000);
									}
								}
								/* There's been an API error. */
								else {
									alert("Something went wrong when checking the game status.");
								}
							}
						});
					}, app.intervals["player-2-join"] * 1000);
				},
			},
			"game": {
				"pane": document.getElementById("view-game"),
				"turn": 0,
				"render": function () {
					/* Set gamecode and round. */
					document.getElementById("code-box").innerHTML = app.user["game"];
					// document.getElementById("round-box").innerHTML = 1;

					/* Build default grid. */
					document.getElementById("game-board").innerHTML = app.views.game.buildGrid("000000000");
					/* Set board live. */
					app.views.game.activateBoard();

					/* Change the prompt. */
					document.getElementById("game-prompt").classList.remove("amber");
					document.getElementById("game-prompt").classList.remove("red");
					document.getElementById("game-prompt").classList.remove("green");

					/* Reset the board classes. */
					document.getElementById("game-board").classList.remove("draw");

					/* Update prompt. */
					document.getElementById("game-prompt").innerHTML = "Just catching up...";

					/* Remove the rematch button. */
					console.log("Hid the remtach button.");
					document.getElementById("game-rematch").style.display = "none";

					/* Make scores if it doesn't exist. */
					if (!app.user.scores) {
						app.user.scores = [0, 0, 0];
					}

					/* Route the turn. */
					app.views.game.router();
				},
				"router": function () {
					/* If it's my turn. */
					if (app.views.game.turn == app.user.player) {
						/* Set play. */
						app.views.game.play();
					} else {
						/* Else set wait for my turn. */
						app.views.game.wait();
					}
				},
				"wait": function () {
					/* Add the loading class to the board. */
					if (app.views.game.turn == 0) {
						document.getElementById("game-board").classList.add("loading");
					}

					/* Turn off the board. */
					app.views.game.deactivateBoard();

					/* Check every 2 seconds for my turn. */
					app.views.game.interval = setInterval(function () {
						QJAX.post({
							"url": app.apihost + "/state/" + app.user["game"],
							"params": {
								"gamecode": app.user.game,
								"auth": app.user.code,
							},
							"callback": function (data) {
								data = JSON.parse(data);
								if (data.success) {
									if (data.payload.error) {
										/* A data issue. */
										alert("Something caused an error: " + data.payload.message);
									} else {
										/* Check if the game has been won.*/
										if (data.payload["game_status"] == 3) {
											/* if it has, update the board, but don't activate it. */
											app.views.game.updateGrid(data.payload["game_board"]);
											document.getElementById("game-board").classList.remove("loading");

											/* Clear prompt. */
											document.getElementById("game-prompt").classList.remove("amber");
											document.getElementById("game-prompt").classList.remove("red");
											document.getElementById("game-prompt").classList.remove("green");

											/* Also update the turn etc. */
											app.views.game.turn = data.payload["game_turn"];
											app.views.game.board = data.payload["game_board"];
											app.views.game.status = data.payload["game_status"];

											/* Stop this interval. */
											clearInterval(app.views.game.interval);

											/* Run the win route. */
											app.views.game.won(data.payload);
										}
										/* Else check if it there's been a rematch vote. */
										else if (data.payload["game_status"] == 4) {
											/* Update the board */
											app.views.game.updateGrid(data.payload["game_board"]);
											document.getElementById("game-board").classList.remove("loading");

											/* Also update the turn etc. */
											app.views.game.turn = data.payload["game_turn"];
											app.views.game.board = data.payload["game_board"];
											app.views.game.status = data.payload["game_status"];

											/* Clear prompt. */
											document.getElementById("game-prompt").classList.remove("amber");
											document.getElementById("game-prompt").classList.remove("red");
											document.getElementById("game-prompt").classList.remove("green");

											/* Stop this interval. */
											clearInterval(app.views.game.interval);

											/* Run the win route. */
											app.views.game.won(data.payload);
										}
										/* else, check if it's our turn... */
										else if (data.payload["game_turn"] == app.user.player) {
											/* Success, so update the board. */
											app.views.game.updateGrid(data.payload["game_board"]);
											app.views.game.activateBoard();
											document.getElementById("game-board").classList.remove("loading");

											/* Clear prompt. */
											document.getElementById("game-prompt").classList.remove("amber");
											document.getElementById("game-prompt").classList.remove("red");
											document.getElementById("game-prompt").classList.remove("green");

											/* Update prompt. */
											document.getElementById("game-prompt").innerHTML = "Your turn!";
											document.getElementById("game-prompt").classList.add("green");

											/* Also update the turn. */
											app.views.game.turn = data.payload["game_turn"];
											app.views.game.board = data.payload["game_board"];

											/* Stop this interval. */
											clearInterval(app.views.game.interval);

											/* Set the router to play... */
											app.views.game.router();
										}
										/* Check if the board has updated... */
										else if (app.views.game.board != data.payload["game_board"]) {
											/* If our board differs, update it. */
											app.views.game.board = data.payload["game_board"];
											app.views.game.updateGrid(data.payload["game_board"]);
											document.getElementById("game-board").classList.remove("loading");

											/* Clear prompt. */
											document.getElementById("game-prompt").classList.remove("amber");
											document.getElementById("game-prompt").classList.remove("red");
											document.getElementById("game-prompt").classList.remove("green");

											/* Update prompt. */
											document.getElementById("game-prompt").innerHTML = "Waiting for opponent.";
											document.getElementById("game-prompt").classList.add("amber");
										} else {
											/* Remove loading. */
											document.getElementById("game-board").classList.remove("loading");

											/* Clear prompt. */
											document.getElementById("game-prompt").classList.remove("amber");
											document.getElementById("game-prompt").classList.remove("red");
											document.getElementById("game-prompt").classList.remove("green");

											/* Update prompt. */
											document.getElementById("game-prompt").innerHTML = "Waiting for opponent.";
											document.getElementById("game-prompt").classList.add("amber");
										}
									}
								} else {
									alert("Failed to check if the opponent has played.");
								}
							},
						});
					}, app.intervals["ingame-polling"] * 1000);
				},
				"play": function () {
					/* Clear prompt. */
					document.getElementById("game-prompt").classList.remove("amber");
					document.getElementById("game-prompt").classList.remove("red");
					document.getElementById("game-prompt").classList.remove("green");

					/* Update prompt. */
					document.getElementById("game-prompt").innerHTML = "Your turn!";
					document.getElementById("game-prompt").classList.add("green");
				},
				"won": function (data) {
					/* If it was a draw. */
					if (data.player == 3) {
						/* Then let the user know */
						document.getElementById("game-board").classList.add("draw");
						document.getElementById("game-prompt").classList.add("amber");
						document.getElementById("game-prompt").innerHTML = "Draw!";
					}
					/* else it was a player... */
					else {
						/* Set the prompt to show the winner. */
						if (data.player == 1 && app.user.player == 1 || data.player == 2 && app.user.player == 2) {
							document.getElementById("game-prompt").innerHTML = "You have won!";
							document.getElementById("game-prompt").classList.add("green");
							app.user.scores[0] += 1;
						} else {
							document.getElementById("game-prompt").innerHTML = "You have lost.";
							document.getElementById("game-prompt").classList.add("red");
							app.user.scores[1] += 1;
						}

						/* Loop over board and highlight the winning tiles. */
						var
							i, j,
							winning = data.combination.split(""),
							tiles = document.getElementsByClassName("tile");
						for (j = 0; j < winning.length; j++) {
							for (i = 0; i < tiles.length; i++) {
								if ((Number(winning[j]) - 1) == i) {
									tiles[i].classList.add("winner");
								}
							}
						}
					}

					/* Update scores. */
					// document.getElementById("player-one-score").innerHTML = app.user.scores[0];
					// document.getElementById("player-one-score").innerHTML = app.user.scores[1];
					cookies.set("xao_game", JSON.stringify(app.user), 0.5);

					/* Setup the rematch button. */
					document.getElementById("game-rematch").style.display = "inline-block";
					if (app.user.voted) {
						/* Sort out the prompt. */
						document.getElementById("game-prompt").classList.remove("red");
						document.getElementById("game-prompt").classList.remove("green");
						document.getElementById("game-prompt").classList.add("amber");

						/* Do strings. */
						document.getElementById("game-prompt").innerHTML = app.strings["prompt-you-voted"];
						document.getElementById("game-rematch").innerHTML = app.strings["game-voted"];
					}

					/* Poll for a rematch. */
					app.views.game.rematchInterval = setInterval(function () {
						QJAX.post({
							"url": app.apihost + "/state/" + app.user.game,
							"params": {
								"auth": app.user.code
							},
							"callback": function (data) {
								if (data) {
									if (data.error) {
										alert("Something went wrong: " + data.message);
									} else {
										/* parse data. */
										data = JSON.parse(data);

										if (data.payload["game_status"] == 4) {
											/* Set route for the waiting page. */
											app.user.route = "rematch";

											if (!app.user.voted) {
												/* Sort out the prompt. */
												document.getElementById("game-prompt").classList.remove("red");
												document.getElementById("game-prompt").classList.remove("green");
												document.getElementById("game-prompt").classList.add("amber");

												/* Do strings. */
												document.getElementById("game-prompt").innerHTML = app.strings["prompt-they-voted"];
											}

										} else if (data.payload["game_status"] == 1) {
											/* Reset shit. */
											app.user.voted = 0;
											app.views.game.turn = data.payload["game_turn"];
											cookies.set("xao_game", JSON.stringify(app.user), 0.5);
											document.getElementById("game-rematch").innerHTML = "Rematch";
											clearInterval(app.views.game.rematchInterval);

											/* Make gameboard load. */
											// document.getElementById("game-board").classList.add("loading");

											/* Send to waiting page. */
											app.switch_view("wait");
										}
									}
								} else {
									alert("Something went wrong!");
								}
							}
						});
					}, app.intervals["ingame-polling"] * 1000);

				},
				"buildGrid": function (state) {
					/* Build grid. */
					var
						i, r, c = "", s_return = "",
						state = state.split("");
					for (i = 0; i < state.length; i++) {
						if (state[i] == "1") {
							c = "X";
						} else if (state[i] == "2") {
							c = "O";
						} else {
							c = "";
						}
						s_return += "<span class='tile t-" + state[i] + "' data-index='" + i + "'>" + c + "</span>";
					}

					/* Return. */
					return s_return;
				},
				"updateGrid": function (state) {
					/* Vars. */
					var
						i, c,
						grid = document.getElementById("game-board"),
						tiles = grid.getElementsByClassName("tile"),
						icons = { 1: "X", 2: "O" }

					for (i = 0; i < tiles.length; i++) {
						if (state[i] != 0 && tiles[i].classList.contains("t-0")) {
							tiles[i].innerHTML = icons[state[i]];
							tiles[i].classList.remove("t-0");
							tiles[i].classList.add("t-" + state[i]);
						}
					}


					/* Return. */
					return true;
				},
				"activateBoard": function () {
					/* Variables. */
					var
						i, tiles = document.getElementsByClassName("tile");

					for (i = 0; i < tiles.length; i++) {
						tiles[i].addEventListener("click", app.views.game.tileClickHandler);
					}
				},
				"deactivateBoard": function () {
					/* Variables. */
					var
						i, tiles = document.getElementsByClassName("tile");

					for (i = 0; i < tiles.length; i++) {
						tiles[i].removeEventListener("click", app.views.game.tileClickHandler);
					}
				},
				"tileClickHandler": function () {
					/* Check if it's our turn. */
					if (app.views.game.turn != app.user.player) {
						alert("Not your turn yet!");
						return false;
					}

					/* Vars. */
					var tilenum = Number(this.getAttribute("data-index")) + 1;
					QJAX.get({
						"url": app.apihost + "/play/" + app.user["game"] + "/" + app.user["code"] + "/" + tilenum,
						"callback": function (data) {
							data = JSON.parse(data);
							if (data.success) {
								if (data.payload.error) {
									/* A data issue. */
									alert("Something caused an error: " + data.payload.message);
								} else {
									/* Success, so update the board. */
									app.views.game.updateGrid(data.payload["game_board"]);

									/* Also update the turn. */
									app.views.game.turn = data.payload["game_turn"];
									app.views.game.board = data.payload["game_board"];

									if (data.payload["game_status"] == 3) {
										/* if it has, update the board, but don't activate it. */
										app.views.game.updateGrid(data.payload["game_board"]);

										/* Also update the turn etc. */
										app.views.game.turn = data.payload["game_turn"];
										app.views.game.board = data.payload["game_board"];
										app.views.game.status = data.payload["game_status"];

										/* Stops the game interval if it's on. */
										clearInterval(app.views.game.interval);

										/* Run the win route. */
										app.views.game.won(data.payload);
									} else {
										/* Clear prompt. */
										document.getElementById("game-prompt").classList.remove("amber");
										document.getElementById("game-prompt").classList.remove("red");
										document.getElementById("game-prompt").classList.remove("green");

										/* Update prompt. */
										document.getElementById("game-prompt").innerHTML = "Sending turn...";
										document.getElementById("game-prompt").classList.add("amber");

										/* Set the interval to wait... */
										app.views.game.router();
									}
								}
							} else {
								/* A connection issue. */
								alert("Something went wrong!");
							}
						},
					});
				}
			}
		},
		"init": function () {
			/* Default to home page. */
			this.switch_view("home");

			/* Assign handlers. */
			this.handlers();

			/* Hide phone-only stuff. */
			if (!app.isphone()) {
				var i, elms = document.getElementsByClassName("mobile-only");
				for (i = 0; i < elms.length; i++) {
					elms[i].style.display = "none";
				}
			}

			/* Check if we have a game cookie. */
			var game_cookie = cookies.get("xao_game");
			if (game_cookie) {
				app.user = JSON.parse(game_cookie);
				app.switch_view("wait");
			}
		},
		"handlers": function () {
			/* Home view. */
			document.getElementById("bttn-start-game").addEventListener("click", function (event) {
				/* Clicked check. */
				if (!this.getAttribute("data-clicked") || this.getAttribute("data-clicked") == "false") {
					this.setAttribute("data-clicked", "true");
				} else {
					return false;
				}

				/* Start a game. */
				QJAX.get({
					"url": app.apihost + "/create",
					"callback": function (data) {
						/* Deal with data if success. */
						data = JSON.parse(data);
						if (data.success) {
							/* If an error occoured. */
							if (!data.payload.error) {
								/* Success. */
								app.user["code"] = data.payload["p_one_code"];
								app.user["game"] = data.payload["game_code"];
								app.user["player"] = 1;
								cookies.set("xao_game", JSON.stringify(app.user), 0.5);
								app.switch_view("wait");
							} else {
								/* An error occoured. */
								alert("An error occoured: " + data.payload.message);
								return false;
							}
						}

						/* Reset the button. */
						document.getElementById("bttn-start-game").setAttribute("data-clicked", "false");
					}
				});
				event.preventDefault();
			});

			/* Join */
			document.getElementById("bttn-join-game").addEventListener("click", function (event) {
				/* Join game. */
				var game_code = document.getElementById("join-game-code").value;
				if (game_code) {
					document.getElementById("join-game-code").value = "";
					/* Clicked check. */
					if (!this.getAttribute("data-clicked") || this.getAttribute("data-clicked") == "false") {
						this.setAttribute("data-clicked", "true");
					} else {
						return false;
					}

					/* If the game code is here. */
					QJAX.get({
						"url": app.apihost + "/join/" + game_code.toUpperCase(),
						"callback": function (data) {
							/* Deal with data if success. */
							data = JSON.parse(data);
							if (data.success) {
								if (!data.payload.error) {
									/* Set the app pointers and save cookie. */
									app.user.game = data.payload["game_code"];
									app.user.code = data.payload["p_two_code"];
									app.user["player"] = 2;
									app.user["route"] = "join";
									cookies.set("xao_game", JSON.stringify(app.user), 0.5);

									/* Switch to the wait page. */
									app.switch_view("wait");
								} else {
									/* Alert the error. */
									alert("Something went wrong: " + data.payload.message);
								}
							} else {
								alert("Something went wrong with joining this game.");
							}

							/* Reset the button. */
							document.getElementById("bttn-join-game").setAttribute("data-clicked", "false");
						}
					});
				}
				event.preventDefault();
			});

			/* Quit game button. */
			document.getElementById("game-quit").addEventListener("click", function (event) {
				/* Delete all app data and start again. */
				app.user = {};
				app.user.player = 1;
				app.user.route = "";
				app.views.game.turn = 0;
				document.getElementById("game-board").classList.remove("draw");
				cookies.del("xao_game");
				app.switch_view("home");
				/* Check for intervals. */
				if (app.views.game.interval) clearInterval(app.views.game.interval);
				if (app.views.game.rematchInterval) clearInterval(app.views.game.rematchInterval);
				event.preventDefault();
			});

			/* Cancel wait button. */
			document.getElementById("wait-cancel").addEventListener("click", function (event) {
				/* Delete all app data and start again. */
				app.user = {};
				app.user.player = 1;
				app.user.route = "";
				app.views.game.turn = 0;
				document.getElementById("game-board").classList.remove("draw");
				cookies.del("xao_game");

				/* Check for intervals. */
				if (app.views.wait.interval) clearInterval(app.views.wait.interval);
				if (app.views.game.rematchInterval) clearInterval(app.views.game.rematchInterval);

				/* Send to home. */
				app.switch_view("home");
				event.preventDefault();
			});

			/* Rematch button. */
			document.getElementById("game-rematch").addEventListener("click", function (event) {
				/* First check that the game was won or is in the loop... */
				event.preventDefault();

				/* Check if the user has voted... */
				if (app.user.voted) {
					alert("You've already voted!");
					document.getElementById("game-rematch").innerHTML = app.strings["game-voted"];
					return false;
				}

				if (app.views.game.status == 3 || app.views.game.status == 4) {
					/* Send the request. */
					QJAX.post({
						"url": app.apihost + "/restart",
						"params": {
							"game_code": app.user.game,
							"auth": app.user.code,
						},
						"callback": function (data) {
							if (data) {
								if (data.error) {
									alert("Something went wrong: " + data.message);
								} else {
									/* Parse data. */
									data = JSON.parse(data);

									/* Set the button to voted. */
									document.getElementById("game-rematch").innerHTML = app.strings["game-voted"];

									/* Sort out the prompt. */
									document.getElementById("game-prompt").classList.remove("red");
									document.getElementById("game-prompt").classList.remove("green");
									document.getElementById("game-prompt").classList.add("amber");

									/* Do strings. */
									document.getElementById("game-prompt").innerHTML = app.strings["prompt-you-voted"];

									/* Save user's vote status. */
									app.user.voted = 1;
									cookies.set("xao_game", JSON.stringify(app.user), 0.5);
								}
							} else {
								alert("Something went wrong with your request, try again.");
							}
						}
					})
				}
			});

			/* Return. */
			return true;
		},
		"switch_view": function (toshow) {
			/* Loop over and hide/show elements. */
			var view;
			for (view in app.views) {
				if (toshow == view) {
					app.views[view].pane.style.display = "block";
					if (app.views[view].render) app.views[view].render();
				} else {
					app.views[view].pane.style.display = "none";
				}
			}

			/* Return. */
			return true;
		}
	};
	app.init();
})();
