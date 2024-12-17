# capacity-estimator

A little tool to try to help estimate available team capacity (in days) for the next sprint.

Useful for helping to gage how many story points of tickets to bring into the next sprint.

It works by reading a iCal calendar at location passed in via an environment variable `CALENDAR_URL`.

It will read all events from the calendar and attempt to estimate team member availability in the next sprint by deducting any leave days recorded in the calendar from their initial capacity.

This was also an excuse for me to learn and play with Deno :-)


## Config

The script looks for a configuration file called `.capacity-estimator-confg.yml` in the current directory.

The config file should look something like this:

```yaml
team:
  name: Team A
  sprint:
    start: dd/mm/yyyy
  members:
    - name: Person 1
      email: person.1@example.com
      capacity: 6 # Override initial capacity because split on another project.
    - name: Person 2
      email: person.2@example.com

  defaults:
    capacity: 10 # This will be the initial capacity of each person assuming a 2-week sprint.

```

## Running

```bash
deno run --watch --env-file=.env -A main.ts
```

## Compiling

Deno allows you to compile the script into a binary executable. This can be done using the following command.

```bash
deno compile --env-file=.env -A main.ts
```

## Known issues

- The result is dependant on team members updating their leave into a calendar. This has been tested using a JIRA calendar which categorises the event as "leaves". This is not currently configurable, so the script may not pick up events from other calendars.

- There is currently a slight bug in the calculation which I need to look at when I get some time. I think it is to do with events that start outside of a sprint window and cross over into the sprint.
