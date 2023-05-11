/**
 * Make a standard JSON request. This handles the inclusion of authentication cookies and parsing JSON, so you don't
 * have to. Should only be used on JSON endpoints.
 * Also adds the base URL, if it is not already included.
 * @param url
 * @param opt
 */
export async function request(url, opt = {}) {
    const start = url.substring(0, 1);

    // Assign values the object
    // Because of how object destructuring works, supplied values will take precedence.
    const fullOptions = {
        credentials: "include",
        headers: {},
        ...opt
    }

    // Check if there is a body supplied, and whether it is an object
    // If it is, convert it to JSON and set the required headers.
    if (fullOptions.body && typeof fullOptions.body === "object") {
        fullOptions.body = JSON.stringify(fullOptions.body);
        fullOptions.headers["Content-Type"] = "application/json";
    }

    url = (start === "/") ? `${process.env.REACT_APP_BACKEND_HOST}${url}` : `${url}`;
    const req = await fetch(url, fullOptions);
    if (req.status === 204) return;
    const t = await req.text();

    try {
        return JSON.parse(t);
    } catch (e) {
        console.error(`Failed to parse response - expected JSON.`);
        console.error(e);
        console.log(t);
        throw new Error("API did not provide JSON. Replied with: " + t);
    }
}