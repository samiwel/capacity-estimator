import { KalenderEvents } from "npm:kalender-events";
import * as dateFns from "https://deno.land/x/date_fns@v2.6.0/index.js";

import { parse } from "jsr:@std/yaml";
import { CapEstimatorConfig, TeamMember } from "./types.ts";

const config = parse(
  await Deno.readTextFile(".capacity-estimator-config.yml"),
) as CapEstimatorConfig;

const teamConfig = config.team;
const defaultCapacity = teamConfig.defaults.capacity;

console.log(
  `The default capacity for team ${teamConfig.name} is %c${defaultCapacity}`,
  "color: blue",
);

const url = Deno.env.get("CALENDAR_URL");

const teamMembers: TeamMember[] = [];
for (const tm of teamConfig.members) {
  const teamMember: TeamMember = {
    name: tm.name,
    email: tm.email,
    capacity: tm?.capacity || defaultCapacity,
  };
  teamMembers.push(teamMember);
  console.log(
    `${teamMember.name} has an initial capacity of ${teamMember.capacity}`,
  );
}

const teamEmails = teamMembers.map((m) => m.email);

async function fetchEventsFromCalendar() {
  const ke = new KalenderEvents({
    url,
  });

  return await ke.getEvents({
    type: "ical",
    preview: daysUntilNextSprint + defaultCapacity, // Look for events that are within the next sprint
    previewUnits: "days",
    pastview: defaultCapacity,
    pastviewUnits: "days",
  });
}

function filterTeamEvents(events: any[], teamEmails: string[]) {
  return events.filter((event) => {
    const organizerEmail = event.organizer?.val
      .toLowerCase()
      .replace("mailto:", "");
    return teamEmails.includes(organizerEmail);
  });
}

const today = dateFns.startOfToday();

// TODO Would be nice to allow overriding this via command line arg.
const nextSprintStartInput = teamConfig.sprint.start;

interface Sprint {
  start: Date;
  end: Date;
}

const startOfNextSprint = dateFns.parse(
  nextSprintStartInput,
  "dd/MM/yyyy",
  new Date(),
  {},
);

const LENGTH_OF_SPRINT_IN_DAYS = 10;

const nextSprint: Sprint = {
  start: startOfNextSprint,
  end: dateFns.endOfDay(
    dateFns.addBusinessDays(startOfNextSprint, LENGTH_OF_SPRINT_IN_DAYS),
  ),
};

console.log({ today });
console.log({ nextSprint });

const daysUntilNextSprint = dateFns.differenceInBusinessDays(
  nextSprint.start,
  today,
);

if (daysUntilNextSprint > 0) {
  console.log(
    `There are %c${dateFns.differenceInBusinessDays(nextSprint.start, today)}`,
    "color: red",
    `days left of this sprint...`,
  );
} else if (daysUntilNextSprint === 0) {
  console.log(`New sprint starts today!`);
} else if (daysUntilNextSprint < 0) {
  console.log(`Next sprint is in the past. Please update your config.`);
  Deno.exit();
}

const daysOfNextSprint = dateFns
  .eachDayOfInterval(nextSprint)
  .filter((day) => !dateFns.isWeekend(day));

const events = await fetchEventsFromCalendar();
const teamEvents = filterTeamEvents(events, teamEmails);

// Give each team member a starting capacity.
// Initial capacity should be > 0 and <= LENGTH_OF_SPRINT_IN_DAYS (to account for time working support or other projects)
// For each event found in the calendar...
// If the event is for someone in the team AND it is a "leave event"
// For each day of the sprint...
// If the interval of the event overlaps with the interval of the day
// Subtract the capacity by 1 (floor to 0)
//
//
// Total the remaining capacity for the entire team.

teamEvents.forEach((event) => {
  if (event.categories.includes("leaves")) {
    daysOfNextSprint.forEach((day) => {
      const dayInterval = {
        start: dateFns.startOfDay(day),
        end: dateFns.endOfDay(day),
      };

      const eventInterval = {
        start: event.eventStart,
        end: event.eventEnd,
      };

      if (dateFns.areIntervalsOverlapping(dayInterval, eventInterval)) {
        const teamMember = teamMembers.find(
          (tm) =>
            tm.email ===
              event.organizer.val.replace("mailto:", "").toLowerCase(),
        );

        if (teamMember) {
          // console.log(`Reducing ${teamMember?.name} capacity by 1`);
          teamMember.capacity = Math.max(teamMember.capacity - 1, 0);
        }
      }
    });
  }
});

console.log(`Estimated team capacity breakdown in the next sprint:`);
console.log(
  teamMembers.map((tm) => ({ name: tm.name, capacity: tm.capacity })),
);

console.log(
  `Team capacity in the next sprint is estimated to be %c${
    teamMembers.reduce(
      (prev, curr) => {
        return prev + curr.capacity;
      },
      0,
    )
  }`,
  "color: green",
);
