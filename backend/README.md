# XAO Backend

## Introduction

This is the XAO API backend, written in PHP.

## Prerequisites

- PHP 8 (with MySQLi)
- Apache 2 (with rewrite mod)
- XAO Database

Once the database has been initialised, duplicate `./config/config.example.php` and call it `config.php`, then fill in the db connection information and CORS domain, if using a different domain for the API and Webapp.
