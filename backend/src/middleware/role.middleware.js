export const isFacultyRole = (role) => role === "faculty" || role === "admin";

export const isClubOrganizerRole = (role) =>
    role === "club_head" || role === "co_head";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const userRole = req.user?.role;
            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required.",
                });
            }

            const hasAccess = allowedRoles.some((allowed) => {
                if (allowed === "faculty" || allowed === "admin") {
                    return isFacultyRole(userRole);
                }
                return userRole === allowed;
            });

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Insufficient permissions.",
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Authorization failed",
                error: error.message,
            });
        }
    };
};

const authorizeAdmin = authorizeRoles("faculty", "admin");

export default authorizeAdmin;
