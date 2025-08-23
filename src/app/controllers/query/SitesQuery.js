const jwt = require('jsonwebtoken');

class SitesQuery {
    
    // Render login page
    login(req, res) {
        res.status(200).render('Login', { layout: 'Login'});
    }
    async Index(req, res, next) {
        try {
            res.status(200).render("pages/main", {
                layout: "main",
                dashboardStats: {
                }
            });
        } catch (error) {
            console.error("Lỗi tải dashboard:", error);
            res.status(500).send("Lỗi server");
        }
    }

};

module.exports = new SitesQuery;