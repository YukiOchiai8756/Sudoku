module.exports = function (req, res, next) {
    const pageRaw = req.query.page;
    const pageSizeRaw = req.query.size;

    let page = 1;
    let size = 10;

    if (pageRaw && !isNaN(pageRaw)) {
        const parsed = parseInt(pageRaw, 10);
        if (parsed > 0) {
            page = parsed;
        }
    }

    if (pageSizeRaw && !isNaN(pageSizeRaw)) {
        const parsed = parseInt(pageSizeRaw, 10);
        if (parsed > 0) {
            size = parsed;
        }
    }

    const offset = (page * size) - size;

    req.pagination = {
        page,
        size,
        offset
    }

    next();
}