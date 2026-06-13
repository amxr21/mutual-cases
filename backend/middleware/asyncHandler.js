/**
 * Wrap an async route handler so any thrown error / rejected promise is
 * forwarded to Express's error middleware instead of becoming an unhandled
 * rejection. Lets controllers use plain `await` without their own try/catch.
 *
 *   router.get("/", asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
