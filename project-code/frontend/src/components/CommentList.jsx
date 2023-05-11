import React, {useContext, useEffect, useMemo, useState} from "react";
import {UserContext} from "./UserContext";
import CommentForm from "./CommentForm";
import {FaReply} from "@react-icons/all-files/fa/FaReply";
import {FaEdit} from "@react-icons/all-files/fa/FaEdit";
import {FaTrashAlt} from "@react-icons/all-files/fa/FaTrashAlt";

export const CommentsList = ({
                                 comments,
                                 handleReply,
                                 handleDelete,
                                 handleEdit,
                             }) => {
    const [assembled, setAssembled] = useState(null);
    const [showReplies, setShowReplies] = useState(true);

    const user = useContext(UserContext);

    useEffect(function () {
        const sortedComments = [...comments].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        const rootComments = sortedComments
            .filter((c) => c.parentID === null)
            .map((c) => ({comment: c, children: []}));

        // Now take all the non-root
        const nonRoot = sortedComments.filter((c) => c.parentID !== null);

        assembleChildren(rootComments, nonRoot);

        for (const c of rootComments) {
            if (nonRoot.length === 0) break;
            assembleChildren(c.children, nonRoot);
        }

        function assembleChildren(rootComments, commentsQueue) {
            for (const rootComment of rootComments) {
                for (let counter = commentsQueue.length - 1; counter >= 0; counter--) {
                    if (commentsQueue[counter].parentID === rootComment.comment.commentID) {
                        rootComment.children.push({
                            comment: commentsQueue[counter],
                            children: [],
                        });
                        commentsQueue.splice(counter, 1);
                    }
                }
            }
        }

        setAssembled(rootComments);
    }, [comments]);

    if (!assembled || (assembled.length === 0)) {
        return <p>No comments</p>;
    }

    return (
        <div
            className="comments-container"
            style={{
                height: "400px",
                overflowY: "scroll",
                width: "500px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
            }}
        >
            {assembled.map((rootComment) => (
                <Comment
                    key={rootComment.commentID}
                    comment={rootComment}
                    currentUser={user}
                    handleReply={handleReply}
                    handleDelete={handleDelete}
                    handleEdit={handleEdit}
                    showReplies={showReplies}
                    toggleReplies={() => setShowReplies(!showReplies)}
                />
            ))}
        </div>
    );
};


const Comment = ({
                     comment: {comment, children},
                     handleReply,
                     handleDelete,
                     handleEdit,
                     currentUser,
                 }) => {
    const canReply = currentUser && currentUser.id !== comment.userID;
    const canEdit = !canReply;
    const canDelete =
        canEdit || (currentUser && currentUser.permission >= parseInt(process.env.REACT_APP_MOD_PERM, 10));

    const [state, setState] = useState();
    const [hideReplies, setHideReplies] = useState(false);

    const createdAt = new Date(comment.createdAt);

    const toggleHideReplies = () => {
        setHideReplies(!hideReplies);
    };

    const userColor = useMemo(() => {
        const colors = ["red", "green", "orange", "purple"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return color;
    }, [comment.userID]);


    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = Math.floor(seconds / 31536000);

        if (interval >= 1) {
            return interval === 1 ? `${interval} year ago` : `${interval} years ago`;
        }
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return interval === 1 ? `${interval} month ago` : `${interval} months ago`;
        }
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return interval === 1 ? `${interval} day ago` : `${interval} days ago`;
        }
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return interval === 1 ? `${interval} hour ago` : `${interval} hours ago`;
        }
        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return interval === 1 ? `${interval} minute ago` : `${interval} minutes ago`;
        }
        return "Just now";
    };

    const sortedChildren = children.sort((a, b) => new Date(b.comment.createdAt) - new Date(a.comment.createdAt));


    console.log(state);
    return (
        <>


            <div key={comment.commentID} className="comment"
                 style={{backgroundColor: 'rgba(103, 179, 212, 0.6)', border: '1px solid #60c7d9'}}>
                <div className="comment-left-part">
                    <div className="comment-user-avatar" style={{backgroundColor: '#60c7d9'}}>
                        {comment.userID}
                    </div>
                </div>

                <div className="comment-right-part">
                    <div className="comment-content">
                        <div className="comment-author" style={{color: '#fff'}}>{comment.username}</div>
                        <div className="comment-date my-auto"
                             style={{color: '#fff', fontSize: '0.8rem'}}>{timeAgo(new Date(createdAt))}</div>
                    </div>

                    <div className="comment-text"
                         style={{color: '#fff', textAlign: "left", marginLeft: "0.2vw"}}>{comment.reviews}</div>


                    <div className="comment-actions">
                        {canReply && (
                            <div className="comment-action" style={{color: '#fff'}} onClick={() => setState("reply")}>
                                <FaReply/> Reply
                            </div>
                        )}
                        {canEdit && (
                            <div className="comment-action" style={{color: '#fff'}} onClick={() => setState("edit")}>
                                <FaEdit/> Edit
                            </div>
                        )}
                        {canDelete && (
                            <div className="comment-action" style={{color: '#fff'}}
                                 onClick={() => handleDelete(comment.commentID)}>
                                <FaTrashAlt/> Delete
                            </div>
                        )}
                        {sortedChildren.length > 0 && (
                            <div className="comment-action" style={{color: '#fff'}} onClick={toggleHideReplies}>
                                {hideReplies ? "Show replies" : "Hide replies"}
                            </div>
                        )}
                    </div>
                </div>

            </div>
            {state === "reply" && <CommentForm submitLabel="Reply" handleSubmit={(text) => {
                setState(null);
                handleReply(text, comment.commentID)
            }} hasCancelButton={true}
                                               handleCancel={() => setState(null)}
            />}

            <div style={{paddingLeft: "1vw"}} className="replies">
                {!hideReplies && sortedChildren.map((childComment) => (
                    <Comment
                        key={childComment.comment.commentID}
                        comment={childComment}
                        currentUser={currentUser}
                        handleReply={handleReply}
                        handleDelete={handleDelete}
                        handleEdit={handleEdit}
                    />
                ))}
            </div>

            {state === "edit" ? (
                <CommentForm
                    submitLabel="Edit"
                    handleSubmit={(text) => {
                        setState(null);
                        handleEdit(comment.commentID, text);
                    }}
                    hasCancelButton={true}
                    handleCancel={() => setState(null)}
                    initialText={comment.reviews}
                />
            ) : (
                ""
            )}

        </>
    );


};


export default CommentsList;