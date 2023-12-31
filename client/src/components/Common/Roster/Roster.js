import TableMain from "../TableMain";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import useFetchPlayerValues from "../../Common/services/hooks/useFetchPlayerValues";
import { getTrendColor } from "../../Common/services/helpers/getTrendColor";

const Roster = ({ roster, league, type }) => {
  const [filter, setFilter] = useState("All");
  const [ppgType, setPpgType] = useState("Total");
  const { state, allplayers, values, projections } = useSelector(
    (state) => state.common
  );

  const matchup_info =
    Object.keys(league).filter((key) => key.startsWith("matchups_")).length > 0;

  const player_ids = matchup_info ? [] : roster?.players || [];

  useFetchPlayerValues({ player_ids });

  const headers = [
    [
      {
        text: (
          <select onChange={(e) => setFilter(e.target.value)}>
            <option>All</option>
            <option>QB</option>
            <option>RB</option>
            <option>WR</option>
            <option>TE</option>
            <option>Picks</option>
          </select>
        ),
        colSpan: 4,
        className: "half",
      },
      {
        text: <p className="username">{roster.username}</p>,
        colSpan: 15,
        className: "half",
      },
      {
        text: (
          <select onChange={(e) => setPpgType(e.target.value)}>
            <option>Total</option>
            <option>In Lineup</option>
            <option>On Bench</option>
          </select>
        ),
        colSpan: 8,
        className: "half",
      },
    ],
    [
      {
        text: "Slot",
        colSpan: 4,
        className: "half",
      },
      {
        text: "Player",
        colSpan: 15,
        className: "half",
      },
      {
        text: "PPG",
        colSpan: 5,
        className: "half",
      },
      {
        text: "#",
        colSpan: 3,
        className: "half end",
      },
    ],
  ];

  const position_abbrev = {
    QB: "QB",
    RB: "RB",
    WR: "WR",
    TE: "TE",
    SUPER_FLEX: "SF",
    FLEX: "WRT",
    WRRB_FLEX: "W R",
    WRRB_WRT: "W R",
    REC_FLEX: "W T",
  };

  const body = () => {
    let players;

    if (filter === "Picks") {
      return roster.draft_picks
        ?.sort(
          (a, b) =>
            a.season - b.season || a.round - b.round || a.order - b.order
        )
        ?.map((pick) => {
          return {
            id: `${pick.season}_${pick.round}_${pick.original_user.user_id}`,
            list: [
              {
                text: (
                  <span>
                    &nbsp;&nbsp;
                    {`${pick.season} Round ${pick.round}${
                      pick.order &&
                      pick.season === parseInt(state.league_season)
                        ? `.${pick.order.toLocaleString("en-US", {
                            minimumIntegerDigits: 2,
                          })}`
                        : pick.original_user.user_id === roster?.user_id
                        ? ""
                        : `(${pick.original_user?.username || "Orphan"})`
                    }`.toString()}
                  </span>
                ),
                colSpan: 27,
                className: "left",
              },
            ],
          };
        });
    } else {
      return (
        filter === "All"
          ? [
              ...roster.starters,
              ...roster.players.filter(
                (player_id) => !roster.starters.includes(player_id)
              ),
            ]
          : roster.players
      )?.map((player_id, index) => {
        if (filter === "All" || allplayers[player_id]?.position === filter) {
          let games;
          let points;
          if (ppgType === "On Bench") {
            games = player_scoring_dict[player_id]?.games_bench;
            points = player_scoring_dict[player_id]?.points_bench;
          } else if (ppgType === "In Lineup") {
            games = player_scoring_dict[player_id]?.games_starter;
            points = player_scoring_dict[player_id]?.points_starter;
          } else {
            games = player_scoring_dict[player_id]?.games_total;
            points = player_scoring_dict[player_id]?.points_total;
          }
          const trend =
            (player_scoring_dict[player_id]?.current || 0) -
            (player_scoring_dict[player_id]?.trade || 0);

          return {
            id: player_id,
            list: [
              {
                text:
                  filter === "All"
                    ? (league.roster_positions &&
                        position_abbrev[league.roster_positions[index]]) ||
                      (league.roster_positions &&
                        league.roster_positions[index]) ||
                      "BN"
                    : allplayers[player_id]?.position,
                colSpan: 4,
              },

              {
                text: allplayers[player_id]?.full_name || "-",
                colSpan: 15,
                className: "left",
                image: {
                  src: player_id,
                  alt: "player headshot",
                  type: "player",
                },
              },
              {
                text: (games > 0 && (points / games).toFixed(1)) || "-",
                colSpan: 5,
              },
              {
                text: games?.toString() || "-",
                colSpan: 3,
              },
            ],
          };
        }
      });
    }
  };

  const player_scoring_dict = useMemo(() => {
    const player_scoring_dict = {};

    roster.players?.forEach((player_id) => {
      const total_points = Object.keys(league)
        .filter(
          (key) =>
            key.startsWith("matchups_") &&
            parseInt(key.split("_")[1]) < state.week
        )
        .reduce(
          (acc, cur) => {
            const matchup = league[cur]?.find(
              (m) => m.roster_id === roster.roster_id
            );
            return {
              games_total:
                acc.games_total +
                (matchup?.players?.includes(player_id) ? 1 : 0),
              points_total:
                acc.points_total + (matchup?.players_points?.[player_id] || 0),
              games_starter:
                acc.games_starter +
                (matchup?.starters?.includes(player_id) ? 1 : 0),
              points_starter:
                acc.points_starter +
                ((matchup?.starters?.includes(player_id) &&
                  matchup?.players_points?.[player_id]) ||
                  0),
              games_bench:
                acc.games_bench +
                (matchup?.players?.includes(player_id) &&
                !matchup?.starters?.includes(player_id)
                  ? 1
                  : 0),
              points_bench:
                acc.points_bench +
                ((matchup?.players?.includes(player_id) &&
                  !matchup?.starters?.includes(player_id) &&
                  matchup?.players_points?.[player_id]) ||
                  0),
            };
          },
          {
            games_total: 0,
            points_total: 0,
            games_starter: 0,
            points_starter: 0,
            games_bench: 0,
            points_bench: 0,
          }
        );

      player_scoring_dict[player_id] = total_points;
    });

    return player_scoring_dict;
  }, [roster, league, state.week]);

  return (
    <>
      <TableMain
        type={type || "secondary half"}
        headers={headers}
        body={body()}
      />
    </>
  );
};

export default Roster;
