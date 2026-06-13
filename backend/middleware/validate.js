/**
 * Request validation middleware backed by Zod.
 *
 * Usage:
 *   router.post("/", validate({ body: productCreateSchema }), asyncHandler(postProduct))
 *
 * Validates and (importantly) REPLACES req.body/params/query with the parsed,
 * coerced, stripped output, so controllers receive clean, typed data and never
 * see unexpected extra fields. On failure, throws a 422 AppError carrying a
 * field-level details map — no raw Zod internals leak to the client.
 */
const { validation } = require("../errors/AppError");

/** Flatten ZodError issues into { field: message } for a clean client payload. */
const formatIssues = (error) => {
    const details = {};
    for (const issue of error.issues) {
        const key = issue.path.length ? issue.path.join(".") : "_";
        if (!details[key]) details[key] = issue.message;
    }
    return details;
};

const validate = (schemas = {}) => (req, _res, next) => {
    try {
        for (const key of ["body", "params", "query"]) {
            if (!schemas[key]) continue;
            const result = schemas[key].safeParse(req[key]);
            if (!result.success) {
                return next(
                    validation("Invalid request data", {
                        in: key,
                        fields: formatIssues(result.error),
                    })
                );
            }
            // Replace with parsed/coerced output (req.query/params are writable in Express 5).
            req[key] = result.data;
        }
        return next();
    } catch (err) {
        return next(err);
    }
};

module.exports = validate;
