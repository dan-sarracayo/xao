# XAO Database

This project is home to all DB management and code for the XAO game.

## Getting Started

### Password Setup

Copy make a new flyway conf file by doing `cp flyway.example.conf flyway.conf`.

Update the default password in your `flyway.conf` and `./data/create_users.sql` to one of your choice.

_Note: Ensure they match to avoid issues!_

### Initialisation

Pipe the `initialise` script into MySQL using a suitable admin user.

```bash
./initialise | sudo mysql -u root -p;
```

Alternatively, login as that MySQL user and run the commands given by the initialise script.

```bash
./initialise;
```

## Migrations

Once initialised, you can run `flyway` as normal.

Info: `flyway info;`

Baseline: `flyway baseline;`

Repair: `flyway repair;`

Migrate: `flyway migrate;`