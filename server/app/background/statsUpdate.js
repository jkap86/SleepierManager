"use strict";

const { fetchScheduleWeek } = require("../api/mflApi");
const { fetchStats } = require("../api/sleeperApi");
const fs = require("fs");

module.exports = async (app) => {
  setTimeout(async () => {
    const schedule_week = await fetchScheduleWeek(
      Math.max(app.get("state")?.week + 18, 19)
    );

    const schedule_json = fs.readFileSync("./data/schedule.json");

    fs.writeFileSync(
      "./data/schedule.json",
      JSON.stringify({
        ...JSON.parse(schedule_json),
        [schedule_week.nflSchedule.week]: schedule_week.nflSchedule.matchup,
      })
    );

    const games_in_progress = schedule_week.nflSchedule.matchup.find(
      (game) =>
        parseInt(game.gameSecondsRemaining) > 0 &&
        (parseInt(game.gameSecondsRemaining) < 3600 ||
          parseInt(game.kickoff) * 1000 < new Date().getTime())
    );

    console.log({ games_in_progress });

    let delay;

    if (!games_in_progress?.kickoff) {
      const stats_week = await fetchStats(
        "2023",
        Math.max(schedule_week.nflSchedule.week - 18, 1)
      );

      const stats_json = fs.readFileSync("./data/stats.json");

      const data = {
        ...JSON.parse(stats_json),
        [schedule_week.nflSchedule.week]: stats_week,
      };

      fs.writeFileSync("./data/stats.json", JSON.stringify(data));

      const sec = new Date().getSeconds();

      delay = (60 - sec) * 1000;
    } else {
      const next_kickoff = Math.min(
        schedule_week.nflSchedule.matchup
          ?.filter((g) => parseInt(g.kickoff) * 1000 > new Date().getTime())
          ?.map((g) => parseInt(g.kickoff) * 1000)
      );

      console.log({ next_kickoff: new Date(next_kickoff) });

      delay = next_kickoff - new Date().getTime();
    }
  }, 5000);
};
