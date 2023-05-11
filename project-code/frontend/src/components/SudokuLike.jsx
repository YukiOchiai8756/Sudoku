import React, {useContext, useEffect, useState} from "react";
import {UserContext} from "./UserContext";
import {Button, ButtonGroup} from 'react-bootstrap';
import {FaThumbsUp} from "@react-icons/all-files/fa/FaThumbsUp";
import {FaThumbsDown} from "@react-icons/all-files/fa/FaThumbsDown";
import {request} from "../util";

/**
 * Here we have the like button for the sudoku.
 * The following functionality includes:
 * 1) Liking a puzzle
 * 2) Disliking puzzle
 * 3) Unliking a previously liked puzzle
 * 4) Undoing a dislike
 * 5)
 * @returns
 */
export const LikeApp = () => {
    const user = useContext(UserContext);

    const currentUserId = user.id;

    const puzzle_id = new URLSearchParams(window.location.search).get('id');
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [activeBtn, setActiveBtn] = useState("none");



    useEffect(() => {
        (async function () {
            const likes = await request(`/api/sudoku/${puzzle_id}/likes`);
            if (likes.likes !== undefined && likes.likes !== null) {
                setLikeCount(likes.likes);
                setDislikeCount(likes.dislikes);

                if (likes.userHasLiked) {
                    if (likes.userHasLiked.isDislike) {
                        setActiveBtn("dislike");
                    } else {
                        setActiveBtn("like");
                    }
                }
            }

        })().catch(console.error);


    }, [puzzle_id]);

    //on click you like the puzzle
    const handleLikeClick = () => {

        const time = new Date();
        const createdAt = time.toISOString();
        if (activeBtn === "none" || activeBtn === "dislike") {
            fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}/like`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"puzzleID": puzzle_id, "userID": currentUserId, "createdAt": createdAt}),
                credentials: "include"

            })
                .then(() => {
                    setLikeCount(likeCount + 1);
                    if (activeBtn === "dislike") {
                        setDislikeCount(dislikeCount - 1);
                    }

                    setActiveBtn("like");


                });

        } else {
            fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}/unlike`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"puzzleID": puzzle_id, "userID": currentUserId}),
                credentials: "include"

            })
                .then(() => {
                    setLikeCount(likeCount - 1);
                    setActiveBtn("none");

                });
        }
    };

    //when you press the dislike button at the start
    const handleDisikeClick = () => {
        const time = new Date();
        const createdAt = time.toISOString();
        if (activeBtn === "none" || activeBtn === "like") {
            fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}/dislike`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"puzzleID": puzzle_id, "userID": currentUserId, "createdAt": createdAt}),
                credentials: "include"

            })
                .then(() => {
                    setDislikeCount(dislikeCount + 1);
                    if (activeBtn === "like") {
                        setLikeCount(likeCount - 1);
                    }

                    setActiveBtn("dislike");


                });

        } else {
            fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}/unlike`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"puzzleID": puzzle_id, "userID": currentUserId}),
                credentials: "include"

            })
                .then(() => {
                    setDislikeCount(dislikeCount - 1);
                    setActiveBtn("none");

                });
        }
    };


    return (
        <div className="container">
            <ButtonGroup aria-label="Basic example">
                <Button
                    className={`btn ${activeBtn === "like" ? "like-active" : ""}`}
                    onClick={handleLikeClick} variant="success"
                >
                    <FaThumbsUp/>
                    {"   "}
                    <span className={`icon-status ${activeBtn === "like" ? "active" : ""}`}></span>
                    <span className="count">{likeCount}</span>
                </Button>

                <Button
                    className={`btn ${activeBtn === "dislike" ? "dislike-active" : ""}`}
                    onClick={handleDisikeClick} variant="danger"
                >
                    <FaThumbsDown/>
                    {"   "}
                    <span className={`icon-status ${activeBtn === "dislike" ? "active" : ""}`}></span>
                    <span className="count">{dislikeCount}</span>
                </Button>
            </ButtonGroup>
        </div>

        // <div className="container">
        //             <div className="btn-container">
        //                 <button
        //                     className={`btn ${activeBtn === "like" ? "like-active" : ""}`}
        //                     onClick={handleLikeClick}
        //                 >
        //                     <svg className="like-button" viewBox="0 0 100 100">
        //                         <path
        //                             className="like-path-outline"
        //                             d="M86.4 19.9c-5.5-5.5-14.4-5.5-19.9 0l-2.2 2.2-2.2-2.2c-5.5-5.5-14.4-5.5-19.9 0l-3.3 3.3c-5.5 5.5-5.5 14.4 0 19.9l25.4 25.4c0.6 0.6 1.3 1.1 2.1 1.4 0.4 0.1 0.8 0.1 1.2 0.1s0.8 0 1.2-0.1c0.8-0.2 1.5-0.7 2.1-1.4l25.4-25.4c5.5-5.5 5.5-14.4 0-19.9l-3.2-3.3z"
        //                         ></path>
        //                         <path
        //                             className={`like-path-fill ${activeBtn === "like" ? "active" : ""}`}
        //                             d="M57.1 71.2c0 0-12.7 8.1-27.1 0-17.4-9.4-23.4-37.4 0-54.4 19.3-15.3 27.1 0 27.1 0 7.7-9.1 27.1-9.1 27.1 0 0 15.4-23.4 45.4 0 54.4C76.3 33.8 70.3 61.8 57.1 71.2z"
        //                         ></path>
        //                     </svg>
        //                     <span className={`icon-status ${activeBtn === "like" ? "active" : ""}`}></span>
        //                     <span className="count">{likeCount}</span>
        //                 </button>
        //                 <button
        //                     className={`btn ${activeBtn === "dislike" ? "dislike-active" : ""}`}
        //                     onClick={handleDisikeClick}
        //                 >
        //                     <svg className="dislike-button" viewBox="0 0 100 100">
        //                         <path
        //                             className="dislike-path-outline"
        //                             d="M81.6 80.1c-5.5 5.5-14.4 5.5-19.9 0l-2.2-2.2-2.2 2.2c-5.5 5.5-14.4 5.5-19.9 0l-3.3-3.3c-5.5-5.5-5.5-14.4 0-19.9l25.4-25.4c0.6-0.6 1.3-1.1 2.1-1.4 0.4-0.1 0.8-0.1 1.2-0.1s0.8 0 1.2 0.1c0.8 0.2 1.5 0.7 2.1 1.4l25.4 25.4c5.5 5.5 5.5 14.4 0 19.9l-3.2 3.3z"
        //                         ></path>
        //                         <path
        //                             className={`dislike-path-fill ${
        //                                 activeBtn === "dislike" ? "active" : ""
        //                             }`}
        //                             d="M42.9 28.8c0 0-12.7-8.1-27.1 0-23.4 12.3-17.4 39.3 0 54.4 19.3 15.3 27.1 0 27.1 0 7.7 9.1 27.1 9.1 27.1 0 0-15.4-23.4-45.4 0-54.4C70.3 52.1 76.3 25.1 42.9 28.8z"
        //                         ></path>
        //                     </svg>
        //                     <span className={`icon-status ${activeBtn === "dislike" ? "active" : ""}`}></span>
        //                     <span className="count">{dislikeCount}</span>
        //                 </button>
        //             </div>
        //         </div>
    );


}
export default LikeApp;