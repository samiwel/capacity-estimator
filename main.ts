import { KalenderEvents } from "npm:kalender-events";
import * as dateFns from "https://deno.land/x/date_fns@v2.6.0/index.js";

const url = Deno.env.get("CALENDAR_URL");

interface TeamMember {
  name: string;
  email: string;
  capacity: number;
}

const teamMembers: TeamMember[] = [
  {
    name: "Samiwel Thomas",
    email: "samiwel.thomas@digital.homeoffice.gov.uk",
    capacity: 6,
  },
];

const teamEmails = teamMembers.map((m) => m.email);

async function fetchEventsFromCalendar() {
  const ke = new KalenderEvents({
    url,
  });

  return await ke.getEvents({
    type: "ical",
    preview: 10,
    previewUnits: "days",
    pastview: 10,
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

const events = await fetchEventsFromCalendar();
const teamEvents = filterTeamEvents(events, teamEmails);
// console.log(teamEvents);

const { eventStart, eventEnd }: { eventStart: Date; eventEnd: Date } =
  teamEvents[0];

const today = dateFns.startOfToday();

const nextSprintStartInput = "17/12/2024";

interface Sprint {
  start: Date;
  end: Date;
}

const startOfNextSprint = dateFns.parse(
  nextSprintStartInput,
  "dd/MM/yyyy",
  new Date(),
);

const LENGTH_OF_SPRINT_IN_DAYS = 10;

const nextSprint: Sprint = {
  start: startOfNextSprint,
  end: dateFns.endOfDay(
    dateFns.addBusinessDays(startOfNextSprint, LENGTH_OF_SPRINT_IN_DAYS),
  ),
};

console.log(`today:${today}`);
console.log(`nextSprint:${JSON.stringify(nextSprint)}`);

console.log(
  `There are ${dateFns.differenceInBusinessDays(nextSprint.start, today)} days left of this sprint...`,
);

const daysOfNextSprint = dateFns
  .eachDayOfInterval(nextSprint)
  .filter((day) => !dateFns.isWeekend(day));

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

console.log(eventStart);
console.log(eventEnd);
