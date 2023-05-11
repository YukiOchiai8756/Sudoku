import {Col, Container, Row, Spinner} from "react-bootstrap";
import Pagination from 'react-bootstrap/Pagination'
import {useEffect, useState} from "react";
import {request} from "../util";
import {ErrorMessage} from "./UserContext";

/**
 * Pagination - Sort items into pages
 * @param url - URL to get items from. The pagination element adds on the query parameters "page" and "pageSize".
 * This API must support pagination for this to work - it needs to look at that page, return a pageSize value and it's data in a "data" array.
 * @param Element Element to render for each item. This must take two props: value (the data item) and handleClick, which should be called when clicked. This click will bubble up to handleItemClick.
 * @param pageSize How many items to fetch at time
 * @param key key in item to use for React key. I.e. puzzleID.
 * @param handleItemClick handler for item clicked. It is passed the full item.
 * @returns {JSX.Element}
 * @constructor
 */
export const PagedList = ({
                              url,
                              Element,
                              pageSize = 50,
                              keyName,
                              handleItemClick
                          }) => {
    const [page, setPage] = useState(1);
    const [items, setItems] = useState(null);
    const [pageCount, setPageCount] = useState(null);
    const [error, setError] = useState(null);


    useEffect(function () {
        async function getValues() {
            const resp = await request(`${url}?page=${page}&size=${pageSize}`);
            if (resp.error) {
                return setError(resp.error);
            }
            if (resp.pageCount !== undefined) {
                if (resp.pageCount !== pageCount) {
                    setPageCount(resp.pageCount);
                }
                setItems(resp.data);
            } else {
                return setError({
                    error_description: "API did not return a page count: Does this API support paging?",
                    error: "Something went wrong"
                })
            }

        }

        getValues().catch(e => setError(e.message || e));

    }, [page, url, pageSize, pageCount]);

    if (error) {
        return <ErrorMessage
            title={`Error: ${error.error || ""}`}
            message={error.error_description || error}
        />
    }

    if (pageCount === undefined || !items) {
        return <Row md="1" className="justify-content-md-center mt-5">
            <Col md={1}>
                <Spinner animation="border" role="status" variant="light">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Col>
        </Row>;
    }

    if (items.length === 0) {
        return <p>There are no quests.</p>;
    }

    const paginationItems = [];
    for (let c = 0; c < pageCount; c++) {
        const num = c + 1;
        paginationItems.push(<Pagination.Item active={num === page} key={`pagin-item-${num}`}
                                              onClick={() => setPage(num)}>{num}</Pagination.Item>);
    }

    return <Container>
        {
            items.map(i => <Element key={i[keyName]} value={i} handleClick={(...args) => handleItemClick(i, ...args)}/>)
        }

        <Pagination className="justify-content-center">
            <Pagination.Prev onClick={() => {
                if (page > 1) {
                    setPage(page - 1);
                }
            }}/>
            {paginationItems}

            <Pagination.Next onClick={() => {
                if (page < pageCount) {
                    setPage(page + 1);
                }
            }}/>
        </Pagination>
    </Container>
};

export default PagedList;