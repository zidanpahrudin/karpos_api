
module.exports = (req, res, next) => {
    if(!req.session.connection_db) {
        return res.json({
            status: "failed",
            message: "session telah habis, silahkan login kembali",
            data: []
        })
    }

    (req, res, next)
}