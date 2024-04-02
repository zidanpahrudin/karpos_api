const mcache = require("memory-cache");
const cache = (durt) => {
    return (req, res, next) => {
        let key = req.method + '_express_'+ req.user.id + req.originalURL || req.url;
        const cacheBody = mcache.get(key);
        if(cacheBody) {
            res.send(cacheBody)
            return;
        } else {
            res.sendResponse = res.send;

            res.send = (body) => {
                mcache.put(key, JSON.parse(body), durt * 1000);
                res.sendResponse(body);
            }
            next();
        }
    }
}

module.exports = cache;