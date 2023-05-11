import {useEffect, useState} from "react";
import {request} from "../util";
import CommentsList from "./CommentList";
import CommentForm from "./CommentForm";

export const Comments = ({puzzleId}) => {
    const [comments, setComments] = useState(null);

    useEffect(function () {
        (async function () {
            const commentsR = await request(`/api/sudoku/${puzzleId}/comments`);
            setComments(commentsR);
        })()
            .catch(e => console.log(e));

    }, [puzzleId]);


    async function addComment(text, parent = null) {
        const resp = await request(`/api/sudoku/${puzzleId}/insertComments`, {
            method: "POST",
            body: {
                reviews: text,
                parentID: parent
            }
        });

        if (resp.error) {
            throw new Error(`${resp.error}: ${resp.error_description || ""}`);
        }

        setComments([resp, ...comments]);
    }

    async function deleteComment(commentId) {
        const resp = await request(`/api/sudoku/${puzzleId}/comment/${commentId}`, {
            method: "DELETE"
        });

        if (resp.error) {
            throw new Error(`${resp.error}: ${resp.error_description || ""}`);
        }

        setComments(comments.filter(c => c.commentID !== commentId));
    }

    async function editComment(commentId, newText) {
        const resp = await request(`/api/sudoku/${puzzleId}/comment/${commentId}`, {
            method: "PATCH",
            body: {
                reviews: newText
            }
        });

        if (resp.error) {
            throw new Error(`${resp.error}: ${resp.error_description || ""}`);
        }

        const newComments = comments.filter(c => c.commentID !== commentId);
        newComments.push(resp);

        setComments(newComments);
    }

    if (!comments) return <p>Loading</p>

    return <>
        <CommentForm hasCancelButton={false} submitLabel="Submit comment" handleSubmit={addComment}/>
        <CommentsList comments={comments} handleReply={addComment} handleEdit={editComment}
                      handleDelete={deleteComment}/>
    </>

};


export default Comments;