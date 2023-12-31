import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import sleeperLogo from "../../images/sleeper_icon.png";
import { useDispatch, useSelector } from "react-redux";
import { setStateHome } from "./redux/actions";
import { resetState } from "../Common/redux/actions";
import "./Homepage.css";

const Homepage = () => {
  const dispatch = useDispatch();
  const { username_searched, leagueId, tab } = useSelector(
    (state) => state.homepage
  );

  useEffect(() => {
    dispatch(resetState());
  }, []);

  return (
    <div id="homepage">
      <div className="picktracker">
        <p
          className="home click"
          onClick={() =>
            dispatch(
              setStateHome({
                tab: tab === "username" ? "picktracker" : "username",
              })
            )
          }
        >
          picktracker
        </p>
        {tab === "picktracker" ? (
          <>
            <input
              onChange={(e) =>
                dispatch(setStateHome({ leagueId: e.target.value }))
              }
              className="picktracker"
              placeholder="League ID"
            />
            <Link className="home" to={`/picktracker/${leagueId}`}>
              Submit
            </Link>
          </>
        ) : null}
      </div>

      <div className="home_wrapper">
        <img alt="sleeper_logo" className="home" src={sleeperLogo} />
        <div className="home_title">
          <strong className="home">Sleepier</strong>
          <div className="user_input">
            <input
              className="home"
              type="text"
              placeholder="Username"
              onChange={(e) =>
                dispatch(setStateHome({ username_searched: e.target.value }))
              }
            />
          </div>
          <a
            className="link click"
            onClick={(e) =>
              (window.location.href = `${window.location.protocol}//${
                window.location.hostname +
                (window.location.port && `:${window.location.port}`)
              }/${
                localStorage.getItem("navTab") || "players"
              }/${username_searched}`)
            }
          >
            Submit
          </a>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
