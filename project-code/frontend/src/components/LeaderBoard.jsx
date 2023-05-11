import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import "../css/leaderboard.css";

function Leaderboard() {
    const [data, setData] = useState([]);

    const svgRef = useRef(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_BACKEND_HOST}/api/leaderboard`,
                    { credentials: "include" }
                );
                if (!response.ok) {
                    throw new Error("Could not fetch leaderboard");
                }
                const leaderboardData = Array.from(await response.json());
                setData(leaderboardData);
            } catch (error) {
                console.error(error);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        function updateLeaderboard() {
            const svg = d3.select(svgRef.current);

            const width = window.innerWidth;
            const height = window.innerHeight;

            const margin = { top: 20, right: 100, bottom: 40, left: 20 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            // Count number of users with each number of points
            const pointsCounts = d3.rollup(
                data,
                (v) => v.length,
                (d) => d.points
            );

            const xScale = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d) => d.points)])
                .range([0, innerWidth]);

            const yScale = d3
                .scaleBand()
                .domain(data.map((d) => d.username))
                .range([0, innerHeight])
                .padding(0.8);

            // Helper function to calculate offset for overlapping usernames
            const calcYOffset = (d) => {
                const counts = pointsCounts.get(d.points);
                const index = data.indexOf(d);
                const samePointsCount = counts - 1;
                const yOffset = yScale.bandwidth() / (counts + 1);
                return (index % counts) * yOffset - samePointsCount * yOffset / 2;
            };

            const xAxis = d3.axisBottom(xScale).ticks(5);

            const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

            svg.attr("width", width).attr("height", height);

            svg
                .selectAll(".bar")
                .data(data, (d) => d.username)
                .join(
                    (enter) => {
                        const g = enter
                            .append("g")
                            .attr("class", "bar")
                            .attr("transform", (d) => `translate(0, ${yScale(d.username)})`);

                        g.append("rect")
                            .attr("x", 0)
                            .attr("width", 0)
                            .attr("height", yScale.bandwidth())
                            .style("fill", "black")
                            .attr("width", (d) => xScale(d.points))
                            .attr("height", yScale.bandwidth() * 0.9)
                            .style("opacity", 1.0)

                            .transition()
                            .duration(1000)
                            .attr("width", (d) => xScale(d.points));

                        g.append("text")
                            .attr("class", "bar-text")
                            .attr("x", (d) => xScale(d.points) + 5)
                            .attr("y", yScale.bandwidth() / 2)
                            .attr("dy", "0.35em")
                            .attr("transform", (d) => `translate(0, ${calcYOffset(d)})`) // Apply offset
                            .text((d) => `${d.username}: ${d.points}`);

                        return g;
                    },
                    (update) => {
                        update
                            .transition()
                            .duration(1000)
                            .attr("transform", (d) => `translate(0, ${yScale(d.username)})`);

                        update
                            .select("rect")
                            .transition()
                            .duration(1000)
                            .attr("width", (d) => xScale(d.points));

                        update
                            .select("text")
                            .transition()
                            .duration(1000)
                            .attr("x", (d) => xScale(d.points) + 5)
                            .text((d) => `${d.username}: ${d.points}`);

                        return update;
                    },
                    (exit) => {
                        exit
                            .transition()
                            .duration(1000)
                            .attr("transform", `translate(0, ${innerHeight})`)
                            .remove();

                        return exit;
                    }
                );

            svg.select(".x-axis").call(xAxis);
            svg.select(".y-axis").call(yAxis);



            // svg
            //     .select(".x-axis")
            //     .attr("transform", `translate(0, ${innerHeight})`)
            //     .call(xAxis);
            //
            // svg.select(".y-axis").call(yAxis);
        }

        updateLeaderboard();
    }, [data]);

    return (
        <div style={{width:'100%', height:'100%'}}>
            <h1>All Time Leaderboard</h1>
            <div className="leaderboard-container">
                <svg ref={svgRef} className="leaderboard-svg">
                    <g className="x-axis" />
                    <g className="y-axis" />
                </svg>
            </div>
        </div>
    );


}

export default Leaderboard;


